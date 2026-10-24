# Authentication Setup (nuxt-auth-utils)

This project uses `nuxt-auth-utils` for session-based authentication with email/password.

## Environment Variables

Add to your `.env` file:

```
NUXT_SESSION_SECRET=your-secret-key-at-least-32-characters-long
```

Generate a secret:

```bash
openssl rand -base64 32
```

For Cloudflare deployment, add this secret via wrangler:

```bash
# Production
wrangler secret put NUXT_SESSION_SECRET

# Preview
wrangler secret put NUXT_SESSION_SECRET --env preview
```

## Create a Test User

```bash
curl -X POST https://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123","name":"Admin"}'
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout current user |

## Usage in Components

```vue
<script setup lang="ts">
const { loggedIn, user, clear: logout } = useUserSession();

async function onLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' });
  await logout();
  await navigateTo('/dashboard/login');
}
</script>
```

## Protecting Routes

### Client-side (middleware)

Create `app/middleware/auth.ts`:

```typescript
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession();

  if (!loggedIn.value) {
    return navigateTo('/dashboard/login');
  }
});
```

Use in page:

```typescript
definePageMeta({
  middleware: 'auth'
});
```

### Server-side (API routes)

```typescript
export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  // Protected code here
});
```

## Database Schema

Users are stored in the `users` table:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| email | TEXT | Unique email |
| password | TEXT | Hashed password |
| name | TEXT | User name (optional) |
| createdAt | TIMESTAMP | Creation date |
