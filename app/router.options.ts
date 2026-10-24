import type { RouterConfig } from '@nuxt/schema';

export default <RouterConfig>{
	scrollBehavior(to, from, savedPosition) {
		if (savedPosition) {
			return savedPosition;
		}

		if (to.hash) {
			const header = document.querySelector('header');
			const headerHeight = header?.offsetHeight || 0;

			return {
				el: to.hash,
				top: headerHeight,
				behavior: 'smooth'
			};
		}

		return { top: 0 };
	}
};
