import { eslintConfigs } from '@wotzebra/oxc-config/eslint';

import withNuxt from './.nuxt/eslint.config.mjs';
import oxlint from './oxlint.config.ts';

export default withNuxt(...eslintConfigs({ oxlint, ignores: ['docs/**', 'presentation/**'] }));
