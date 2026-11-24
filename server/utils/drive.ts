import { db } from 'hub:db';

import { eq, tables, type DriveConnection } from './drizzle';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const FILE_FIELDS = 'id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,parents';
// Refresh a little early, so a token never expires halfway through a request.
const TOKEN_MARGIN_MS = 60_000;
const MAX_ANCESTOR_DEPTH = 25;

export const DRIVE_SCOPES = ['email', 'https://www.googleapis.com/auth/drive'];

interface RawDriveFile {
	id: string;
	name: string;
	mimeType: string;
	size?: string;
	modifiedTime?: string;
	webViewLink?: string;
	thumbnailLink?: string;
	parents?: string[];
}

export function toDriveFile(file: RawDriveFile): DriveFile {
	return {
		id: file.id,
		name: file.name,
		mimeType: file.mimeType,
		isFolder: file.mimeType === FOLDER_MIME,
		size: file.size ? Number(file.size) : null,
		modifiedTime: file.modifiedTime ?? null,
		webViewLink: file.webViewLink ?? null,
		hasThumbnail: Boolean(file.thumbnailLink)
	};
}

function driveTokenKey(): string {
	const key = useRuntimeConfig().driveTokenKey;
	if (!key) {
		throw createError({ statusCode: 500, message: 'NUXT_DRIVE_TOKEN_KEY is niet ingesteld' });
	}

	return key;
}

export function isDriveConfigured(): boolean {
	const config = useRuntimeConfig();

	return Boolean(config.oauth.google.clientId && config.oauth.google.clientSecret && config.driveTokenKey);
}

export async function getDriveConnection(): Promise<DriveConnection | undefined> {
	return await db.select().from(tables.driveConnection).where(eq(tables.driveConnection.id, 'main')).get();
}

export async function requireDriveConnection(): Promise<DriveConnection> {
	const connection = await getDriveConnection();
	if (!connection) {
		throw createError({ statusCode: 409, message: 'Google Drive is nog niet gekoppeld' });
	}

	return connection;
}

export async function saveDriveConnection(input: {
	googleEmail: string;
	refreshToken: string;
	accessToken: string;
	expiresIn: number;
	connectedBy: string;
}): Promise<void> {
	const values = {
		googleEmail: input.googleEmail,
		encryptedRefreshToken: await encryptSecret(input.refreshToken, driveTokenKey()),
		accessToken: input.accessToken,
		accessTokenExpiresAt: new Date(Date.now() + input.expiresIn * 1000),
		connectedBy: input.connectedBy
	};

	await db
		.insert(tables.driveConnection)
		.values({ id: 'main', ...values })
		.onConflictDoUpdate({ target: tables.driveConnection.id, set: values });
}

async function refreshAccessToken(connection: DriveConnection): Promise<string> {
	const { clientId, clientSecret } = useRuntimeConfig().oauth.google;
	const refreshToken = await decryptSecret(connection.encryptedRefreshToken, driveTokenKey());

	const response = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			refresh_token: refreshToken,
			grant_type: 'refresh_token'
		})
	});
	if (!response.ok) {
		// invalid_grant: revoked access, or a consent screen still in "Testing" (tokens die after 7 days).
		throw createError({ statusCode: 409, message: 'De Google Drive-koppeling is verlopen, koppel opnieuw' });
	}

	const data = (await response.json()) as { access_token: string; expires_in: number };
	await db
		.update(tables.driveConnection)
		.set({ accessToken: data.access_token, accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000) })
		.where(eq(tables.driveConnection.id, 'main'));

	return data.access_token;
}

async function getAccessToken(): Promise<string> {
	const connection = await requireDriveConnection();
	const expiresAt = connection.accessTokenExpiresAt?.getTime() ?? 0;
	if (connection.accessToken && expiresAt - TOKEN_MARGIN_MS > Date.now()) {
		return connection.accessToken;
	}

	return await refreshAccessToken(connection);
}

/** Authorized request to Google; turns Google's errors into Dutch ones the UI can show. */
export async function driveRequest(url: string, init: RequestInit = {}): Promise<Response> {
	const token = await getAccessToken();
	const headers = new Headers(init.headers);
	headers.set('Authorization', `Bearer ${token}`);

	const response = await fetch(url, { ...init, headers });
	if (response.status === 404) {
		throw createError({ statusCode: 404, message: 'Bestand niet gevonden in Google Drive' });
	}
	if (!response.ok) {
		const detail = await response.text().catch(() => '');
		console.error('Google Drive error', response.status, detail);
		throw createError({ statusCode: 502, message: 'Google Drive gaf een fout, probeer later opnieuw' });
	}

	return response;
}

async function driveJson<T>(path: string, params: Record<string, string> = {}, init: RequestInit = {}): Promise<T> {
	const query = new URLSearchParams({ supportsAllDrives: 'true', ...params });
	const response = await driveRequest(`${DRIVE_API}${path}?${query}`, init);

	return (await response.json()) as T;
}

export async function getDriveFile(fileId: string): Promise<RawDriveFile> {
	return await driveJson<RawDriveFile>(`/files/${encodeURIComponent(fileId)}`, { fields: FILE_FIELDS });
}

export async function listDriveFolder(folderId: string): Promise<DriveFile[]> {
	const files: RawDriveFile[] = [];
	let pageToken: string | undefined;

	do {
		const page = await driveJson<{ files: RawDriveFile[]; nextPageToken?: string }>('/files', {
			q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`,
			fields: `nextPageToken,files(${FILE_FIELDS})`,
			orderBy: 'folder,name',
			pageSize: '200',
			includeItemsFromAllDrives: 'true',
			...(pageToken ? { pageToken } : {})
		});
		files.push(...page.files);
		pageToken = page.nextPageToken;
	} while (pageToken && files.length < 1000);

	return files.map(toDriveFile);
}

export async function createDriveFolder(name: string, parentId: string): Promise<DriveFile> {
	const file = await driveJson<RawDriveFile>(
		'/files',
		{ fields: FILE_FIELDS },
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] })
		}
	);

	return toDriveFile(file);
}

/** Resumable upload: one call for the metadata, one for the bytes, so large files don't need a multipart body. */
export async function uploadDriveFile(
	parentId: string,
	file: { name: string; type: string; data: Uint8Array<ArrayBuffer> }
): Promise<DriveFile> {
	const query = new URLSearchParams({ uploadType: 'resumable', supportsAllDrives: 'true', fields: FILE_FIELDS });
	const session = await driveRequest(`${UPLOAD_API}/files?${query}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json; charset=UTF-8',
			'X-Upload-Content-Type': file.type,
			'X-Upload-Content-Length': String(file.data.byteLength)
		},
		body: JSON.stringify({ name: file.name, parents: [parentId] })
	});
	const location = session.headers.get('Location');
	if (!location) {
		throw createError({ statusCode: 502, message: 'Google Drive gaf geen upload-adres terug' });
	}

	const response = await driveRequest(location, {
		method: 'PUT',
		headers: { 'Content-Type': file.type },
		body: file.data
	});

	return toDriveFile((await response.json()) as RawDriveFile);
}

export async function fetchDriveContent(fileId: string): Promise<Response> {
	return await driveRequest(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`);
}

export async function fetchDriveThumbnail(fileId: string, size = 400): Promise<Response> {
	const file = await getDriveFile(fileId);
	if (!file.thumbnailLink) {
		throw createError({ statusCode: 404, message: 'Geen voorbeeld beschikbaar' });
	}

	return await driveRequest(file.thumbnailLink.replace(/=s\d+$/, `=s${size}`));
}

// Files known to sit inside the root folder, so thumbnails of a listed folder don't each walk up the tree.
// Per isolate and short-lived: a moved file is re-checked within minutes.
const insideRoot = new Map<string, number>();
const INSIDE_ROOT_TTL_MS = 10 * 60_000;

export function rememberInsideRoot(fileIds: string[]): void {
	const expires = Date.now() + INSIDE_ROOT_TTL_MS;
	for (const id of fileIds) {
		insideRoot.set(id, expires);
	}
}

export async function isInsideRoot(fileId: string, rootId: string): Promise<boolean> {
	if ((insideRoot.get(fileId) ?? 0) > Date.now()) {
		return true;
	}
	const inside = fileId === rootId || (await pathFromRoot(fileId, rootId)) !== null;
	if (inside) {
		rememberInsideRoot([fileId]);
	}

	return inside;
}

/** Path from the project's root folder down to the folder, or null when it lies outside the root. */
export async function pathFromRoot(folderId: string, rootId: string): Promise<{ id: string; name: string }[] | null> {
	const path: { id: string; name: string }[] = [];
	let currentId: string | undefined = folderId;

	for (let depth = 0; currentId && depth < MAX_ANCESTOR_DEPTH; depth++) {
		const file = await getDriveFile(currentId);
		path.unshift({ id: file.id, name: file.name });
		if (file.id === rootId) {
			return path;
		}
		currentId = file.parents?.[0];
	}

	return null;
}

/** Accepts a folder id or any Drive folder URL. */
export function parseDriveFolderId(input: string): string {
	const match = input.match(/folders\/([\w-]+)/) ?? input.match(/[?&]id=([\w-]+)/);

	return match?.[1] ?? input.trim();
}

export const DRIVE_FOLDER_MIME = FOLDER_MIME;
