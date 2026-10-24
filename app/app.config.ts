export default defineAppConfig({
	icon: {
		class: 'icon',
		mode: 'svg'
	},
	ui: {
		colors: {
			primary: 'violet'
		},
		input: {
			slots: {
				root: 'relative flex items-center'
			}
		},
		prose: {
			h1: {
				slots: {
					base: 'text-primary'
				}
			},
			h2: {
				slots: {
					base: 'text-primary'
				}
			},
			p: {
				base: ''
			}
		}
	}
});
