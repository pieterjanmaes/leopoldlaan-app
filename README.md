# Leopoldlaan – verbouwingsapp

A private app to run the renovation of our house: tasks, a timeline, the budget and the project files in Google Drive, shared with the household and (in a limited way) with contractors and family.

Built on the WOTZ Nuxt starter: Nuxt 4, Nuxt UI 4, NuxtHub (Cloudflare Workers + D1), Drizzle ORM, nuxt-auth-utils. The UI is Dutch only.

## Features

| Page | What it does |
|---|---|
| **Overzicht** (`/`) | Open tasks, progress, expected cost, unpaid invoices, this week, overdue, blocked tasks, budget per category, recent files |
| **Taken** (`/taken`) | Kanban board (drag & drop, long-press on touch) and list view, filters, quick add, detail slideover with dependencies, comments and Drive attachments |
| **Planning** (`/planning`) | Gantt chart grouped by phase, coloured by category, milestones, today line, zoom; flags tasks that start before a task they wait for |
| **Grondplan** (`/grondplan`) | One plan per floor: an image from Drive (e.g. an export from [openPlan3D](https://github.com/laanlabs/openPlan3D) or the architect's plan) or a blank grid. Draw zones (rooms) and drop numbered pins with a note, colour, room and linked task. Zoom, pan, drag pins. Built with `vue-konva` |
| **Budget** (`/budget`) | Budget lines, quotes, invoices and subsidies (premies). Forecast per category = invoices + open approved quotes, or the plan when that's higher. Contingency buffer, Excel export of invoices |
| **Bestanden** (`/bestanden`) | Browser for the project folder in Google Drive: folders, upload (drag & drop), previews |
| **Contacten** (`/contacten`) | Contractors, suppliers, architect… |
| **Phone app** | Installable PWA (manifest, icons, home-screen shortcuts); *Installeer als app* in the account menu, with a step-by-step guide on iPhone |
| **Instellingen** (`/instellingen`) | Project, Drive connection, categories (werkposten), rooms, phases & milestones, users and invites |

### Roles

- **Eigenaar** (`owner`) — everything, including users, invites and the Drive connection.
- **Huisgenoot** (`member`) — everything except user management and Drive connection.
- **Extern** (`external`) — a contractor or family member, linked to a contact. Sees only tasks assigned to that contact (or to them), can change their status, comment and upload photos. No budget, no other contacts, no file browser. Enforced in the API (`server/utils/auth.ts`, `server/utils/tasks.ts → taskVisibility`, `server/utils/attachments.ts`), not only in the UI.

People join through an invite link (Instellingen → Gebruikers → Iemand uitnodigen). The link is shown once; only its hash is stored.

## Getting started

Requires Node ≥ 24 and pnpm.

```bash
pnpm install
cp .env.example .env   # fill NUXT_SESSION_PASSWORD and NUXT_DRIVE_TOKEN_KEY (32+ random chars each)
pnpm run dev           # https://localhost:3000 (HTTPS when localhost.pem / localhost-key.pem exist)
```

Create the owner account plus default categories, rooms, phases and a starter task chain:

```bash
curl -k -X POST https://localhost:3000/api/seed
```

Add `?demo` to also get a demo budget, quote and invoice. Default login: `eigenaar@leopoldlaan.test` / `changeme123` (override with `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`).

## Google Drive

Files stay in your own Drive, in one project folder. The owner connects Drive once; everybody else reaches the files through the server, so contractors don't need a Google account.

1. In [Google Cloud Console](https://console.cloud.google.com/): create a project and enable the **Google Drive API**.
2. **OAuth consent screen**: type *External*, add the `.../auth/drive` scope, then **Publish app → In production**. In *Testing* mode Google expires refresh tokens after 7 days. An unverified app works fine for a handful of users; you'll click through a "Google hasn't verified this app" warning once.
3. **Credentials → OAuth client ID → Web application**. Authorized redirect URIs:
   - `https://localhost:3000/auth/google-drive`
   - `https://<your-domain>/auth/google-drive`
4. Set `NUXT_OAUTH_GOOGLE_CLIENT_ID`, `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` and `NUXT_DRIVE_TOKEN_KEY`.
5. Instellingen → **Koppel Google Drive**. A folder "Verbouwing – <project>" is created in My Drive; you can point the app at another folder by pasting its link.

How it works: `server/routes/auth/google-drive.get.ts` runs the OAuth flow with `access_type=offline`; the refresh token is stored AES-GCM-encrypted (`server/utils/crypto.ts`). `server/utils/drive.ts` is a thin wrapper around Drive REST v3 (no `googleapis` SDK — too heavy for Workers). Downloads and thumbnails are proxied, and every request checks the file sits inside the project folder (or, for externals, is attached to one of their tasks). Uploads are capped at 50 MB per file (Workers' request limit is 100 MB).

## Data model

`server/db/schema.ts` — money is integer **cents**, calendar dates are `'YYYY-MM-DD'` text, ids are CUID2. Tables: `users`, `project` (single row), `rooms`, `categories`, `phases`, `contacts`, `tasks`, `task_dependencies`, `task_comments`, `budget_lines`, `quotes`, `expenses`, `subsidies`, `drive_connection` (single row), `attachments` (Drive file ↔ task/quote/expense/…), `invites`, `floor_plans` and `plan_markers` (points stored as 0..1 fractions of the plan, so markers stay put at any size).

Pure logic lives in `shared/utils/` (budget forecast, VAT, dates, dependency checks) and is unit-tested in `test/unit/`.

After a schema change: `pnpm run db:generate`; migrations apply automatically on `pnpm run dev`.

## Commands

```bash
pnpm run dev          # dev server
pnpm run lint         # oxlint (type-aware) + eslint
pnpm run format       # oxfmt
pnpm run test         # vitest (unit + nuxt)
pnpm run build        # Cloudflare build
pnpm run db:generate  # migration from schema changes
```

## Deployment

Same pipeline as the starter (`.github/workflows/deploy-*.yml`, see `CLAUDE.md`). Before the first deploy:

```bash
wrangler d1 create leopoldlaan-app            # paste the id into wrangler.jsonc
wrangler d1 create leopoldlaan-app-preview    # and this one under env.preview
wrangler secret put NUXT_SESSION_PASSWORD
wrangler secret put NUXT_TURNSTILE_SECRET_KEY
wrangler secret put NUXT_OAUTH_GOOGLE_CLIENT_ID
wrangler secret put NUXT_OAUTH_GOOGLE_CLIENT_SECRET
wrangler secret put NUXT_DRIVE_TOKEN_KEY
wrangler secret put SEED_KEY
```

Then seed once with `curl -X POST -H "x-seed-key: …" https://<domain>/api/seed` (set `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD` as secrets first).

## Ideas for later

- **AI**: scan an invoice or quote (photo/PDF → amount, VAT, supplier, date), a chat assistant over your own data ("how much is left for the bathroom?"), generate a task plan from a description. The schema already stores everything structured for this.
- Weekly e-mail digest via a cron trigger (see `boswachter-app`), offline support for the phone app, a site diary with photos.
