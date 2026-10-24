export default defineNuxtPlugin(() => {
	const useShowNav = useState('showNav', () => true);

	// Set up scroll tracking once, not on every page navigation
	const { y, arrivedState, directions } = useScroll(window);

	watch(y, () => {
		if (y.value >= 50 && directions.bottom && !arrivedState.bottom) {
			useShowNav.value = false;
		}
	});

	watch(directions, () => {
		if (directions.bottom && y.value >= 50) {
			useShowNav.value = false;
		}

		if (directions.top) {
			useShowNav.value = true;
		}
	});

	watch(arrivedState, () => {
		if (arrivedState.bottom || arrivedState.top) {
			useShowNav.value = true;
		}
	});
});
