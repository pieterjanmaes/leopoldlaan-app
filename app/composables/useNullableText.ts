/** v-model for an optional text field whose API value is null when empty. */
export function useNullableText<T extends Record<K, string | null | undefined>, K extends keyof T>(state: T, key: K) {
	return computed({
		get: () => state[key] ?? '',
		set: (value: string) => {
			state[key] = (value || null) as T[K];
		}
	});
}
