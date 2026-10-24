import { oxfmtConfig } from '@wotzebra/oxc-config/oxfmt';

export default oxfmtConfig({
	ignorePatterns: ['server/db/migrations', 'docs', 'presentation']
});
