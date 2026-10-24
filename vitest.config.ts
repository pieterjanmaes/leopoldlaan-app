import { fileURLToPath } from 'node:url';

import { defineVitestProject } from '@nuxt/test-utils/config';
import { defineConfig } from 'vitest/config';

// Two projects (https://nuxt.com/docs/getting-started/testing):
// - unit: plain Node, fast. Pure logic and server helpers; Nitro's auto-imports are stubbed per test.
// - nuxt: composables and components inside a real Nuxt app (happy-dom), with @nuxt/test-utils.
export default defineConfig({
	test: {
		projects: [
			{
				resolve: {
					alias: {
						'@': fileURLToPath(new URL('./app', import.meta.url)),
						'@@': fileURLToPath(new URL('.', import.meta.url))
					}
				},
				test: {
					name: 'unit',
					include: ['test/unit/**/*.test.ts'],
					environment: 'node'
				}
			},
			await defineVitestProject({
				test: {
					name: 'nuxt',
					include: ['test/nuxt/**/*.test.ts'],
					environment: 'nuxt',
					environmentOptions: {
						nuxt: {
							domEnvironment: 'happy-dom'
						}
					}
				}
			})
		]
	}
});
