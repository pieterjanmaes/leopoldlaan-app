/** Stand-in for NuxtHub's `hub:db` virtual module, so server helpers can be imported in plain Node tests. */
export const db = new Proxy(
	{},
	{
		get() {
			throw new Error('hub:db is not available in unit tests; stub the call instead');
		}
	}
);
