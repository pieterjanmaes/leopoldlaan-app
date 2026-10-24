<template>
	<UApp class="flex min-h-dvh flex-col">
		<Transition name="slide-nav-in">
			<div
				v-show="showNav"
				class="fixed z-10 block w-full">
				<CHeader />
			</div>
		</Transition>

		<UMain class="flex-1">
			<slot />
		</UMain>

		<CFooter />
	</UApp>
</template>

<script setup lang="ts">
	const showNav = useState('showNav', () => true);
</script>

<style lang="scss">
	.slide-nav-in {
		&-enter-active,
		&-leave-active {
			transition: transform 0.75s cubic-bezier(0, 0.61, 0.33, 1);
			transition-delay: 250ms;
		}

		&-enter-from,
		&-leave-to {
			transform: translateY(-100%);
		}

		&-enter-to,
		&-leave-from {
			transform: translateY(0);
		}
	}
</style>
