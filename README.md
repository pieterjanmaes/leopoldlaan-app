# WOTZ Nuxt Starter

A production-ready Nuxt 4 starter template by [Who Owns The Zebra](https://whoownsthezebra.com), configured with modern tooling and best practices for building multilingual web applications.

> **📚 Full developer docs live in [`docs/`](./docs)** — searchable site for onboarding new contributors. Run `cd docs && pnpm install && pnpm run dev` to read locally, or browse the deployed version once it's up.
>
> **🎤 Live-talk version:** there's also a [Slidev presentation](./presentation) for tech talks / onboarding sessions. Run `cd presentation && pnpm install && pnpm run dev` to project locally.

## Features

- **Nuxt 4** — Latest Nuxt with improved performance and developer experience
- **Nuxt UI v4** — Modern component library with Tailwind CSS v4
- **i18n** — Multilingual support (Dutch/French for Belgium) with canonicalId-based translation linking
- **Nuxt Content v3** — Markdown-based content management with locale-aware collections
- **Nuxt Studio** — Visual content editing via [nuxt.studio](https://nuxt.studio)
- **NuxtHub** — Cloudflare deployment infrastructure with D1 database
- **SEO** — Sitemap, robots, OG images, link checker, schema.org
- **Authentication** — `nuxt-auth-utils` with scrypt password hashing
- **Database** — Drizzle ORM (D1/SQLite), CUID2 IDs, auto-migrations on dev start
- **Oxlint + Oxfmt** — Fast lint + format, paired with ESLint for stylistic Vue rules
- **TypeScript** — Strict type-checking everywhere
- **HTTPS dev server** — Required for Studio + Turnstile

## Requirements

- **Node.js** >= 22.0.0
- **pnpm** (with `shamefully-hoist=true` in `.npmrc`)

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env

# 3. Start the development server (https://localhost:3000)
pnpm run dev
```

The dev server runs on **HTTPS** at `https://localhost:3000`. SSL certificates (`localhost.pem`, `localhost-key.pem`) are required.

Visit `https://localhost:3000` — `/` redirects to `/nl` (default locale).

### Generating the SSL certificates

Use [mkcert](https://www.npmjs.com/package/mkcert) to generate locally-trusted certificates. Install once, then run from the project root:

```bash
# Install the local CA (one-time, system-wide)
npx mkcert create-ca

# Generate the localhost cert
npx mkcert create-cert --domains localhost
```

This creates `ca.crt`, `ca.key`, `cert.crt`, and `cert.key`. Rename them to match what `nuxt.config.ts` expects:

```bash
mv cert.crt localhost.pem
mv cert.key localhost-key.pem
```

The `.pem` files are gitignored and stay on your machine. The CA only needs to be installed once per development machine; subsequent projects can reuse it with `npx mkcert create-cert` only.

## Environment Variables

Variables fall into three categories. Each goes to a different place depending on whether you're developing locally or deploying.

| Category | When used | Where to set (local) | Where to set (deployed) |
|---|---|---|---|
| **A. Build-time** (public, baked into client bundle) | During `nuxt build` | `.env` | GitHub Actions **repository variables** |
| **B. Runtime secrets** (server-only, sensitive) | At each request | `.env` | Cloudflare **Wrangler secrets** |
| **C. CI/CD** (not used by the app) | During GitHub Actions deploy | n/a | GitHub Actions **repository secrets/variables** |

### Files

- `.env` — Local development (gitignored, contains all three categories for convenience)
- `.env.example` — Template with safe test keys and full inline documentation
- `.env.preview` — Optional local override for preview builds (gitignored)
- `.env.production` — Optional local override for production builds (gitignored)

### A. Build-time variables (public)

Embedded into the client JavaScript bundle. **They are visible to anyone who views your site source**, so only put non-sensitive values here.

| Variable | Purpose |
|---|---|
| `NUXT_SITE_ENV` | `staging` or `production` — controls `robots.txt` |
| `NUXT_SITE_URL` | Public URL used for SEO canonical / sitemap / OG images |
| `NUXT_PUBLIC_TURNSTILE_SITE_KEY` | Public Turnstile site key |
| `NUXT_PUBLIC_USERBACK_TOKEN` | Optional Userback widget token |
| `NUXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` | Optional GTM container ID |

**Deploy via GitHub:** add each as a **repository variable** in `Settings → Secrets and variables → Actions → Variables`. The deploy workflows pass them into `nuxt build` automatically.

### B. Runtime secrets (server-only)

Read by server endpoints at request time. **Never include real values in committed files or GitHub repo variables.**

| Variable | Purpose |
|---|---|
| `NUXT_SESSION_PASSWORD` | Session-cookie encryption secret (32+ random chars) |
| `NUXT_TURNSTILE_SECRET_KEY` | Server-side Turnstile token verification |
| `NUXT_OG_IMAGE_SECRET` | OG image signing secret (`nuxt-og-image`) |
| `SEED_KEY` | Gate for `POST /api/seed` in non-dev environments |

**Deploy via Cloudflare Wrangler:**
```bash
wrangler secret put NUXT_SESSION_PASSWORD              # production
wrangler secret put NUXT_SESSION_PASSWORD --env preview # preview
# ... repeat for each runtime secret
```

Wrangler secrets are injected as Cloudflare Worker env vars at runtime. Nuxt's `runtimeConfig` reads them and overrides any defaults baked at build time.

You can ALSO mirror these as GitHub repository secrets if you want them baked into the build as defaults — but the Cloudflare secrets will win at runtime regardless.

### C. CI/CD (deploy-only)

Used by the GitHub Actions workflows in `.github/workflows/`, not by the app itself.

| Variable | Where | Purpose |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | GitHub **secret** | Wrangler deploy auth (scope: Workers Scripts + D1) |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub **variable** | Cloudflare account to deploy into |

### Local development

For local dev, just copy `.env.example → .env` and fill in the test keys. All three categories live together in `.env`; the split only matters for deployed environments.

Open [`.env.example`](./.env.example) for the full annotated reference.

## Internationalization

- **Default locale:** `nl` (nl-BE)
- **Supported:** `nl`, `fr` (fr-BE) — easy to add more
- **Strategy:** URL prefix (`/nl/...`, `/fr/...`)
- **Root redirect:** `/` → `/nl` (302)
- **Browser detection:** off — locale only switches via the language switcher

### Content collections per locale

Each locale gets its own Nuxt Content collection. Content paths are locale-agnostic — the locale prefix is handled by the i18n router, not by Nuxt Content. See `content.config.ts`:

```ts
content_nl: defineCollection({
  type: 'page',
  source: { include: 'nl/**/*.md', prefix: '/' },
  schema: pageSchema
}),
```

A file at `content/nl/cookie-policy.md` is queryable at content path `/cookie-policy`, rendered at URL `/nl/cookie-policy`.

### Translation linking via `canonicalId`

Each markdown file declares a `canonicalId` in frontmatter. Files in different locales with the same `canonicalId` are treated as translations:

```md
---
canonicalId: cookie-policy
title: Cookieverklaring
---
```

`app/composables/useTranslatedPath.ts` resolves equivalent URLs across locales by querying canonicalId. `CLanguageSwitcher` uses this to navigate to the correct translated page even if filenames differ across locales.

## Authentication & Dashboard

The starter includes an admin dashboard at `/dashboard`:
- **Form Submissions** (`/dashboard`) — list + CSV/Excel export
- **User Management** (`/dashboard/users`) — superadmin-only CRUD

Sessions via `nuxt-auth-utils`. Roles: `admin`, `superadmin`. Server-side DB access uses `import { db } from 'hub:db'`.

### Seed the database

After `pnpm run dev`:
```bash
curl -k -X POST https://localhost:3000/api/seed
```

This creates a superadmin user. Check `server/api/seed.post.ts` for default credentials.

## Nuxt Studio

Visual content editing via [nuxt.studio](https://nuxt.studio):
1. Run `pnpm run dev`
2. Open `https://localhost:3000/nl`
3. Click the floating Studio button (top-left); sign in with GitHub on first use
4. Edit markdown content visually; changes sync to your local filesystem

The repository is auto-detected from `git config remote.origin.url`. The `<nuxt-studio>` element is given a high z-index in `app/assets/css/main.css` so the button isn't covered by the sticky `<UHeader>`.

For deployed/self-hosted Studio, set `studio.repository` explicitly in `nuxt.config.ts` and add `STUDIO_GITHUB_CLIENT_ID` / `STUDIO_GITHUB_CLIENT_SECRET` to your environment.

## Development

```bash
pnpm run dev          # HTTPS dev server on :3000
pnpm run build        # Production build (Cloudflare Workers)
pnpm run preview      # Preview production build locally
pnpm run lint         # Lint (oxlint + eslint)
pnpm run lint:fix     # Auto-fix lint issues
pnpm run format       # Format (oxfmt)
pnpm run format:check # Check formatting without writing
pnpm run test         # Run Vitest (unit + nuxt)
pnpm run test:watch   # Vitest in watch mode
```

### Database

Migrations are managed by `drizzle-kit` and auto-applied by `@nuxthub/core` on dev start:

```bash
# After editing server/db/schema.ts, generate a new migration:
pnpm run db:generate

# Open Drizzle Studio (web UI for the local dev DB):
pnpm run db:studio
# → opens https://local.drizzle.studio connected to .data/db/sqlite.db

# Inspect the local dev DB via CLI:
sqlite3 .data/db/sqlite.db ".schema"

# If the DB gets into a broken state:
rm -f .data/db/sqlite.db .data/db/sqlite.db-shm .data/db/sqlite.db-wal
pnpm run dev  # re-applies all migrations from scratch
curl -k -X POST https://localhost:3000/api/seed
```

**Do not hand-write SQL files** in `server/db/migrations/sqlite/` — drizzle-kit tracks migrations in `meta/_journal.json`, and hand-written files run but aren't journaled, causing ordering conflicts.

**Drizzle Studio caveats:**
- Don't run `pnpm run dev` and `db:studio` writes at the same time — SQLite is single-writer; read-only inspection is fine.
- `db:studio` connects to the local dev DB only. For production D1 data, use the Cloudflare dashboard's D1 console.
- Never alter schema through Studio — always go through `db:generate` so the migration ends up journaled.

### Critical Nitro preset note

`nitro.preset` is set conditionally in `nuxt.config.ts`:

```ts
preset: process.env.NODE_ENV === 'development' ? undefined : 'cloudflare_module'
```

The `cloudflare_module` preset only applies for `pnpm run build`. In dev, leaving it unset is required so `@nuxt/content` registers its node sub-preset (the cloudflare sub-preset breaks client-side content queries in dev because it expects a Cloudflare ASSETS binding that doesn't exist).

## Deployment

Deployed to Cloudflare Workers via Wrangler.

### Prerequisites

1. Copy `wrangler.jsonc.example` → `wrangler.jsonc` and fill in your account/database IDs.
2. Set runtime secrets:

```bash
wrangler secret put NUXT_TURNSTILE_SECRET_KEY
wrangler secret put NUXT_TURNSTILE_SECRET_KEY --env preview
wrangler secret put NUXT_SESSION_PASSWORD
wrangler secret put NUXT_SESSION_PASSWORD --env preview
```

### Manual deploy

```bash
pnpm run build:deploy:preview      # Build + deploy to preview
pnpm run build:deploy:production   # Build + deploy to production
pnpm run deploy:preview            # Deploy only (skip build)
pnpm run deploy:production
```

These use `dotenv -e` to load environment-specific variables before `nuxt build` runs.

### GitHub Actions

`.github/workflows/` contains three workflows:
- `deploy-preview.yml` — push to `preview` branch
- `deploy-preprod.yml` — push to `preprod` branch
- `deploy-prod.yml` — push to `main` (or `sanity-publish` repository_dispatch)

Each builds with environment variables from GitHub repo secrets/vars and deploys via wrangler. Required secrets: `CLOUDFLARE_API_TOKEN`, `NUXT_SESSION_PASSWORD`, `NUXT_TURNSTILE_SECRET_KEY`, `SEED_KEY`. Required vars: `CLOUDFLARE_ACCOUNT_ID`, `NUXT_SITE_URL`, `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, `NUXT_PUBLIC_USERBACK_TOKEN`.

## Project Structure

```
app/
├── assets/css/      # Tailwind + custom CSS (incl. Studio z-index override)
├── assets/svg/logos # Custom icon collection (prefix: logo:)
├── components/      # Vue components (auto-imported, custom = C-prefix)
├── composables/     # Auto-imported (useTranslatedPath, etc.)
├── layouts/         # default, dashboard, login
├── middleware/      # auth, superadmin
├── pages/           # File-based routing; [...slug].vue renders content
└── plugins/         # cookieFirst, userback, scrollBehavior

content/
├── nl/              # Dutch markdown (canonicalId-tagged)
└── fr/              # French markdown (canonicalId-tagged)

i18n/
├── i18n.config.ts   # vue-i18n config
└── locales/         # nl.json, fr.json

server/
├── api/             # API endpoints (auth, users, form, seed)
├── db/              # schema.ts, migrations/, seed.ts
└── utils/           # drizzle helper

public/              # Static files served at root
```

## Tooling

### Linting + Formatting

All rules come from the shared [`wotzebra/oxc-config`](https://github.com/wotzebra/oxc-config) package (`@wotzebra/oxc-config`); the project config files only pass what differs.

- **Oxlint** (`oxlint.config.ts`) — fast rust-based linter, covers most rules (`oxlintConfig()`)
- **Oxfmt** (`oxfmt.config.ts`) — fast formatter, tab indentation, single quotes, `printWidth: 120`, one attribute per line (`oxfmtConfig()`)
- **ESLint** (`eslint.config.mjs`) — kept for Vue-specific stylistic rules oxlint doesn't cover (`eslintConfigs()`)
- `vueIndentScriptAndStyle: true` in oxfmt — Vue `<script>`/`<style>` contents are indented one level

To pick up rule changes from the shared package: `pnpm update @wotzebra/oxc-config`.

Run `pnpm run lint:fix` then `pnpm run format` to apply both.

### Code Standards

- Strictly type-safe TypeScript
- Tab indentation
- Single quotes for strings
- Max line length: 120 characters
- See `eslint.config.mjs`, `oxlint.config.ts`, `oxfmt.config.ts`

## Modules

| Module | Purpose |
|---|---|
| `@nuxt/ui` | Component library (v4) |
| `@nuxtjs/i18n` | Internationalization |
| `@nuxt/scripts` | Script loading optimization |
| `@nuxt/content` | Content management (pinned to 3.12.x) |
| `@nuxtjs/seo` | SEO optimization |
| `@nuxt/eslint` | ESLint integration |
| `@nuxt/image` | Image optimization |
| `@nuxtjs/turnstile` | Cloudflare Turnstile bot protection |
| `@vueuse/nuxt` | VueUse composables |
| `nuxt-auth-utils` | Authentication |
| `@nuxthub/core` | Cloudflare deployment + D1 |
| `oxc-nuxt` | Oxlint integration |
| `nuxt-studio` | Visual content editor |
| `nuxt-security` | HTTP security headers, CSP, rate limiting |

## Security

`nuxt-security` is configured in `nuxt.config.ts` under `security`:

- **Content-Security-Policy** — allows Cloudflare, CookieFirst, Google Tag Manager / Analytics, and inline scripts/eval (required by Nuxt hydration). Loose enough for Studio to operate; tighten later if needed.
- **Rate limiter** — off globally, on for `/api/*` (10 requests per minute per IP) via `routeRules`
- **CORP / COEP** — relaxed so external fonts and third-party scripts load (`cross-origin`, `unsafe-none`)
- **SSG hash generation** — off (we SSR via Cloudflare Workers, not generate)

If you tighten the CSP later (remove `'unsafe-inline'` / `'unsafe-eval'`, restrict `connect-src`), retest Nuxt Studio — you may also need to add explicit `frame-ancestors` entries for `nuxt.studio` and `content.nuxt.com`.

## Key Documentation

- [Nuxt 4 Documentation](https://nuxt.com/docs)
- [Nuxt UI Documentation](https://ui.nuxt.com)
- [Nuxt Content](https://content.nuxt.com)
- [Nuxt Content i18n integration](https://content.nuxt.com/docs/integrations/i18n)
- [Nuxt Studio](https://nuxt.studio)
- [NuxtHub](https://hub.nuxt.com)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
- [CLAUDE.md](./CLAUDE.md) — Internal guide for AI-assisted development

## License

Private — Who Owns The Zebra

## Support

For questions or issues, contact [Who Owns The Zebra](https://whoownsthezebra.com).
