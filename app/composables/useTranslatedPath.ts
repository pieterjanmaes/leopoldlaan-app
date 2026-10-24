import type { Collections } from '@nuxt/content';

interface TranslatedPaths {
	[locale: string]: string;
}

/**
 * Composable to get translated paths for the current page based on canonicalId.
 *
 * Content files should include a `canonicalId` frontmatter field to link translations:
 * ```md
 * ---
 * canonicalId: about
 * ---
 * ```
 *
 * Files with the same canonicalId across locales are treated as translations of each other.
 */
export function useTranslatedPath() {
	const { locale, locales } = useI18n();
	const route = useRoute();

	async function getTranslatedPath(targetLocale: string, canonicalId?: string): Promise<string> {
		if (!canonicalId) {
			const currentPath = route.path;
			const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(\/|$)/, '/');
			return `/${targetLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
		}

		const collection = `content_${targetLocale}` as keyof Collections;

		try {
			const content = await queryCollection(collection).where('canonicalId', '=', canonicalId).first();

			if (content?.path) {
				return content.path === '/' ? `/${targetLocale}` : `/${targetLocale}${content.path}`;
			}
		} catch {
			// Silently fall back if query fails
		}

		const currentPath = route.path;
		const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(\/|$)/, '/');
		return `/${targetLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
	}

	async function getAllTranslatedPaths(canonicalId?: string): Promise<TranslatedPaths> {
		const paths: TranslatedPaths = {};
		const localeList = locales.value as Array<{ code: string }>;

		await Promise.all(
			localeList.map(async (loc) => {
				paths[loc.code] = await getTranslatedPath(loc.code, canonicalId);
			})
		);

		return paths;
	}

	return {
		getTranslatedPath,
		getAllTranslatedPaths,
		currentLocale: locale
	};
}
