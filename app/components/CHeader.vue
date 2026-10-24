<template>
	<UHeader
		id="header"
		:toggle="false">
		<template #title>
			<CLogo />
		</template>

		<template #right>
			<UColorModeSwitch />
			<CLanguageSwitcher />
		</template>
	</UHeader>
</template>
