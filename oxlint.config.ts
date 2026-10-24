import { oxlintConfig } from '@wotzebra/oxc-config/oxlint';

import { withNuxt } from './.nuxt/oxlint.mjs';

export default withNuxt(
	oxlintConfig({
		// Separate projects with their own package.json and Nuxt/Slidev setup
		ignorePatterns: ['docs', 'presentation']
	})
);
