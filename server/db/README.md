# Database Setup (NuxtHub + Drizzle ORM)

This project uses NuxtHub with Drizzle ORM for database management.

## Schema

The database schema is defined in `server/db/schema.ts`.

## Generating Migrations

After modifying the schema, generate a new migration:

```bash
npx nuxt db generate
```

This creates SQL migration files in `server/db/migrations/sqlite/`.

## Applying Migrations

Migrations are automatically applied when running:

```bash
npm run dev
```

Or manually with:

```bash
npx nuxt db migrate
```

## Usage in API Routes

```typescript
import { db } from '#hub/db';
import { tables } from '../utils/drizzle';

export default defineEventHandler(async (event) => {
  // Select
  const submissions = await db.select().from(tables.formSubmissions).all();

  // Insert
  const newSubmission = await db.insert(tables.formSubmissions).values({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  }).returning().get();

  // Update
  await db.update(tables.formSubmissions)
    .set({ email: 'new@example.com' })
    .where(eq(tables.formSubmissions.id, 1));

  // Delete
  await db.delete(tables.formSubmissions)
    .where(eq(tables.formSubmissions.id, 1));
});
```

## Adding New Tables

1. Add table definition in `server/db/schema.ts`
2. Generate migration: `npx nuxt db generate`
3. Run dev server or migrate: `npx nuxt db migrate`

## Remote Database

To use the remote D1 database during development:

```bash
npx nuxt dev --remote
```