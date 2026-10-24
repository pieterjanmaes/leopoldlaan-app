declare module '#auth-utils' {
	interface User {
		id: string;
		email: string;
		name: string;
		role: 'owner' | 'member' | 'external';
		contactId: string | null;
	}

	interface UserSession {
		loggedInAt?: number;
	}
}

export {};
