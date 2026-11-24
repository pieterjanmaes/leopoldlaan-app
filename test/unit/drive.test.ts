import { parseDriveFolderId, toDriveFile } from '@@/server/utils/drive';
import { describe, expect, it } from 'vitest';

describe('parseDriveFolderId', () => {
	it('takes the id out of a folder link', () => {
		expect(parseDriveFolderId('https://drive.google.com/drive/folders/1AbC-dEf_123?usp=sharing')).toBe('1AbC-dEf_123');
		expect(parseDriveFolderId('https://drive.google.com/open?id=1XyZ')).toBe('1XyZ');
	});

	it('accepts a bare id', () => {
		expect(parseDriveFolderId('  1AbC  ')).toBe('1AbC');
	});
});

describe('toDriveFile', () => {
	it('maps Google metadata to what the UI needs', () => {
		expect(
			toDriveFile({
				id: '1',
				name: 'Offerte dak.pdf',
				mimeType: 'application/pdf',
				size: '20480',
				thumbnailLink: 'https://lh3.googleusercontent.com/x=s220'
			})
		).toMatchObject({ isFolder: false, size: 20480, hasThumbnail: true, webViewLink: null });
		expect(toDriveFile({ id: '2', name: 'Facturen', mimeType: 'application/vnd.google-apps.folder' }).isFolder).toBe(
			true
		);
	});
});
