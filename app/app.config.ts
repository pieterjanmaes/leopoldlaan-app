export default defineAppConfig({
	icon: {
		class: 'icon',
		mode: 'svg'
	},
	ui: {
		colors: {
			primary: 'amber',
			neutral: 'stone'
		},
		input: {
			slots: {
				root: 'relative flex items-center'
			}
		}
	}
});
