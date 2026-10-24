import { defineContentConfig, defineCollection, z } from '@nuxt/content';

const pageSchema = z.object({
	canonicalId: z.string().optional(),
	title: z.string(),
	description: z.string().optional()
});

export default defineContentConfig({
	collections: {
		content_nl: defineCollection({
			type: 'page',
			source: { include: 'nl/**/*.md', prefix: '/' },
			schema: pageSchema
		}),
		content_fr: defineCollection({
			type: 'page',
			source: { include: 'fr/**/*.md', prefix: '/' },
			schema: pageSchema
		})
	}
});
