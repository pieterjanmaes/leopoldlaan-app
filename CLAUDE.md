# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Developer docs site:** Full human-readable documentation lives in `docs/` — a Docus-based Nuxt site organized by topic (getting-started, content, i18n, database, auth, security, deployment, troubleshooting). Source markdown is at `docs/content/**`. When updating CLAUDE.md or README.md, also consider whether the change belongs in `docs/content/`.

**Live-talk presentation:** A Slidev deck about the project lives in `presentation/slides.md` (~30 slides, tech-talk format). When the project architecture changes meaningfully, consider whether the slides need updating too — speaker notes reference specific code paths and gotchas.

## Project Overview

This is a Nuxt 4 starter project by Who Owns The Zebra (WOTZ) configured with:
- **Nuxt UI v4** as component library with Tailwind CSS v4
- **i18n** for multilingual support (Dutch/French for Belgium)
- **Nuxt Content v3** for markdown-based content management
- **Nuxt Studio** for visual content editing
- **NuxtHub** for deployment infrastructure with D1 database
- **SEO modules** for search optimization
- **Authentication** with nuxt-auth-utils
- **Database** with Drizzle ORM (D1/SQLite)
- **Oxlint + Oxfmt** for fast linting and formatting (paired with ESLint for stylistic rules)

**Node requirement:** >=24.0.0 (`nuxt-security@2.6+` declares `engines.node >=24.0.0`)
**Package manager:** pnpm (with `shamefullyHoist: true` in `pnpm-workspace.yaml` — pnpm 11 no longer reads settings from `.npmrc`)

## Development Commands

```bash
# Development server (https://localhost:3000 with SSL)
pnpm run dev

# Production build
pnpm run build

# Preview production build
pnpm run preview

# Linting
pnpm run lint
pnpm run lint:fix

# Formatting (oxfmt)
pnpm run format
pnpm run format:check

# Tests (Vitest) — unit + nuxt projects, see "Testing" below
pnpm run test
pnpm run test:watch
```

## Database Commands

```bash
# Generate migration after schema changes (drizzle-kit owns this)
pnpm run db:generate

# Open Drizzle Studio (web UI for the local dev DB at .data/db/sqlite.db).
# Opens https://local.drizzle.studio in the browser.
# DO NOT run while pnpm run dev is also writing — SQLite is single-writer.
# DO NOT use Studio to alter schema; always go through db:generate so the
# migration ends up journaled in meta/_journal.json.
pnpm run db:studio

# Migrations are auto-applied on dev server start by @nuxthub/core.
# Do NOT hand-write SQL files in server/db/migrations/sqlite/ — drizzle-kit
# tracks them in meta/_journal.json and hand-written files get applied
# but not journaled, leading to ordering/conflict bugs.

# Inspect local dev DB (libsql/sqlite at .data/db/sqlite.db)
sqlite3 .data/db/sqlite.db ".schema"
sqlite3 .data/db/sqlite.db "SELECT name FROM _hub_migrations;"

# If the dev DB gets into a broken state, wipe and let it re-init:
rm -f .data/db/sqlite.db .data/db/sqlite.db-shm .data/db/sqlite.db-wal

# Seed database (dev only)
curl -k -X POST https://localhost:3000/api/seed
```

## Deployment Commands

```bash
# Deploy to preview/staging (build + deploy)
pnpm run build:deploy:preview

# Deploy to production (build + deploy)
pnpm run build:deploy:production

# Deploy only (no build)
pnpm run deploy:preview
pnpm run deploy:production
```

### Environment Loading

The project uses **`dotenv -e`** to load environment-specific variables:
- `dotenv -e .env.preview` - Loads `.env.preview` then runs the next command
- `dotenv -e .env.production` - Loads `.env.production` then runs the next command

## Project Structure (Nuxt 4)

This project uses **Nuxt 4 directory structure** where `app/` is the source folder:
- `app/components/` - Vue components (auto-imported, prefix with `C` for custom)
- `app/pages/` - File-based routing
- `app/pages/[...slug].vue` - Catch-all renders content collection pages
- `app/layouts/` - Layout templates (`default`, `dashboard`, `login`)
- `app/plugins/` - Nuxt plugins
- `app/composables/` - Auto-imported composables (incl. `useTranslatedPath`)
- `app/middleware/` - Route middleware (`auth`, `superadmin`)
- `app/assets/` - Static assets (CSS, SVG)
- `content/{locale}/` - Markdown content per locale (`nl/`, `fr/`)
- `i18n/locales/` - Translation JSON files (`nl.json`, `fr.json`)
- `server/api/` - API endpoints
- `server/db/` - Drizzle schema + migrations (sqlite/)

## Internationalization

- **Default locale:** `nl` (nl-BE)
- **Supported locales:** `nl`, `fr` (fr-BE)
- **Strategy:** `prefix` — every URL is locale-prefixed (`/nl/...`, `/fr/...`)
- **Root redirect:** `/` → `/nl` via `i18n.rootRedirect` (302)
- **Browser detection:** Disabled (explicit locale via switcher)

### Content + i18n integration pattern

This setup uses **one Nuxt Content collection per locale**, with content paths that DO NOT contain the locale prefix. The locale prefix is added at the URL routing level by `@nuxtjs/i18n`.

**`content.config.ts`:**
```ts
content_nl: defineCollection({
  type: 'page',
  source: { include: 'nl/**/*.md', prefix: '/' },  // prefix MUST be '/'
  schema: pageSchema
}),
content_fr: defineCollection({
  type: 'page',
  source: { include: 'fr/**/*.md', prefix: '/' },
  schema: pageSchema
})
```

A file at `content/nl/cookie-policy.md` is stored with path `/cookie-policy` (NOT `/nl/cookie-policy`).

**`app/pages/[...slug].vue`** queries the locale-specific collection:
```ts
const collection = ('content_' + locale.value) as keyof Collections;
const content = await queryCollection(collection).path(slug.value).first();
```

**DO NOT** prepend the locale to the query path. The collection scope already encodes the locale.

### Translation linking via `canonicalId`

Every content file must declare a `canonicalId` in frontmatter. Files in different locales that share a canonicalId are treated as translations of one another:

```md
---
canonicalId: cookie-policy
title: Cookieverklaring
---
```

`app/composables/useTranslatedPath.ts` queries by canonicalId to resolve the equivalent URL in each locale. `CLanguageSwitcher` uses these resolved paths via the shared `translatedPaths` state set in `[...slug].vue`.

This means filenames can diverge across locales (e.g. `cookie-policy.md` in NL vs `politique-cookies.md` in FR) — the switcher still navigates correctly because it follows canonicalId, not the slug.

## Database Schema

Located in `server/db/schema.ts`:

### Users Table
- `id` (text, CUID2) - Primary key
- `email` (text, unique) - User email
- `password` (text) - scrypt-hashed password
- `name` (text) - Display name
- `role` (text) - `admin` or `superadmin`
- `createdAt` (integer timestamp)

### Form Submissions Table
- `id` (text, CUID2) - Primary key
- `firstName`, `lastName`, `email`, `phone`, `timeSlot` (text)
- `createdAt` (integer timestamp)

## Authentication

Using `nuxt-auth-utils`:
- Session-based authentication, scrypt password hashing
- User roles: `admin`, `superadmin`

### Middleware
- `auth.ts` - Requires authenticated user
- `superadmin.ts` - Requires superadmin role

### API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - Create user (superadmin only)
- `GET /api/users` - List users (superadmin only)
- `PATCH /api/users/[id]` - Update user (superadmin only)
- `DELETE /api/users/[id]` - Delete user (superadmin only)
- `POST /api/users/[id]/reset-password` - Reset password (superadmin only)
- `GET /api/form/submissions` - List form submissions
- `POST /api/form/submit` - Submit form
- `POST /api/seed` - Seed database (dev only)

Server-side database access uses the `hub:db` virtual module:
```ts
import { db } from 'hub:db';
```

## Dashboard

Located at `/dashboard` (uses the `dashboard` layout):
- **Form Submissions** (`/dashboard`) — list + CSV/Excel export
- **User Management** (`/dashboard/users`) — CRUD, superadmin only

## Nuxt Studio

Visual content editor at https://nuxt.studio.

### Dev mode

1. Run `pnpm run dev`
2. Open `https://localhost:3000/nl`
3. Click the floating Studio button (top-left). On first use, sign in with GitHub at nuxt.studio.

The Studio module activates automatically in dev mode and mounts a `<nuxt-studio>` web component. Repository auto-detection from `git config remote.origin.url` works once the app is in a git repo.

### Z-index override

Studio's button can be obscured by `<UHeader>` (sticky, high z-index). `app/assets/css/main.css` raises it:
```css
nuxt-studio {
  position: relative;
  z-index: 9999;
}
```

### `studio.i18n.defaultLocale`

Set in `nuxt.config.ts` so Studio knows which collection to default to:
```ts
studio: {
  i18n: { defaultLocale: 'nl' }
}
```

For production-deployed Studio (self-hosted), set `studio.repository` explicitly and add `STUDIO_GITHUB_CLIENT_ID` / `STUDIO_GITHUB_CLIENT_SECRET` env vars. For dev + cloud editor, leave commented out.

## Critical Nitro Preset Detail

**`nitro.preset` is set conditionally** in `nuxt.config.ts`:
```ts
preset: process.env.NODE_ENV === 'development' ? undefined : 'cloudflare_module'
```

**Why:** `@nuxt/content`'s cloudflare sub-preset (triggered by `preset: 'cloudflare_module'`) registers a `/__nuxt_content/{collection}/sql_dump.txt` handler that expects a Cloudflare `ASSETS` binding. In dev there is no `ASSETS`, so the handler returns an empty string and the client-side content DB stays empty. This causes pages to render fine on initial SSR but go blank when navigating client-side (e.g. switching locales). Using the default preset in dev makes `@nuxt/content` register its node sub-preset which reads the SQL dump from filesystem.

The cloudflare preset is still active for `pnpm run build` (deploy target).

## Vite optimizeDeps

The real safeguard against duplicate Vue instances → `Cannot read properties of null (reading 'ce')` crashes is `resolve.dedupe: ['vue']`, which forces a single Vue copy. The config in `nuxt.config.ts`:
```ts
vite: {
  resolve: { dedupe: ['vue'] },          // forces single Vue copy — this is what prevents the 'ce' crash
  optimizeDeps: {
    include: ['@userback/widget', 'zod', 'zod/locales']
  }
}
```

`@vue/devtools-core` / `@vue/devtools-kit` were previously in `optimizeDeps.include`, but Vite 8 (Nuxt 4.5.0) can no longer resolve those entry paths, so they only produced a `NUXT_B7002` "could not be resolved" warning. They were dropped — `resolve.dedupe` already covers the duplicate-Vue case, so nothing is lost. `@unhead/schema-org/vue` was also dropped because schema.org is disabled (see below).

`@nuxt/content`'s mdc module injects its own `@nuxtjs/mdc > <dep>` entries into `optimizeDeps.include` that Vite 8 also can't resolve (two `@nuxtjs/mdc` versions end up in the tree), producing the same `NUXT_B7002` warning — but those aren't in our config, they're module-injected. A `vite:extendConfig` hook in `nuxt.config.ts` strips any `@nuxtjs/mdc > …` entries from the merged Vite config before Vite sees them. It's behaviour-neutral (Vite already skips unresolvable entries) and just silences the warning; remove the hook once `@nuxt/content` ships a fix.

If Vite logs "discovered new dependencies at runtime" for a new package later, add it to `optimizeDeps.include`. `resolve.dedupe` keeps it safe.

## Modules in Use

1. `@nuxt/ui` - Component library (v4)
2. `@nuxtjs/i18n` - Internationalization
3. `@nuxt/scripts` - Script loading optimization
4. `@nuxt/content` (v3.14.x) - Content management
5. `@nuxtjs/seo` - SEO optimization (sitemap, robots, og-image, link-checker, schema.org)
   - **schema.org is disabled** via `schemaOrg: { enabled: false }` in `nuxt.config.ts`. The app emits no structured data, and `nuxt-schema-org@6.2.3` crashes under the unhead v3 shipped by Nuxt 4.5.0 (`Cannot read properties of undefined (reading 'push' / 'resolveGraph')`). Re-enable once `nuxt-schema-org` publishes an unhead-v3 fix. All other `@nuxtjs/seo` features stay active.
6. `@nuxt/eslint` - ESLint integration
7. `@nuxt/image` - Image optimization
8. `@nuxtjs/turnstile` - Cloudflare Turnstile (bot protection)
9. `@vueuse/nuxt` - VueUse composables
10. `nuxt-auth-utils` - Authentication
11. `@nuxthub/core` - Cloudflare deployment infrastructure
12. `oxc-nuxt` - Oxlint integration
13. `nuxt-studio` - Visual content editor
14. `nuxt-security` - HTTP security headers, CSP, rate limiting

## Security Headers (`nuxt-security`)

Configured in `nuxt.config.ts` under `security`. Highlights:

- **CSP** — tuned to allow Cloudflare, CookieFirst, Google Tag Manager / Analytics, and inline scripts/eval (required by Nuxt's hydration runtime and some third-party widgets)
- **Rate limiter** — disabled globally (`rateLimiter: false`); enabled selectively for `/api/*` via `routeRules` (10 requests per minute per IP)
- **SSG hash generation** — disabled (`ssg: false`) because we SSR via Cloudflare Workers, not generate
- **CORP / COEP** — relaxed to `cross-origin` / `unsafe-none` so external assets (fonts, third-party scripts) load

```ts
routeRules: {
  '/api/*': {
    security: {
      rateLimiter: { tokensPerInterval: 10, interval: 60_000 }
    }
  }
}
```

**Studio compatibility:** the current CSP allows `nuxt-studio`'s same-origin scripts and Studio's edit flow because:
- `script-src` includes `'unsafe-inline'` and `'unsafe-eval'` (Studio runtime needs both)
- `connect-src` allows `https:` broadly (Studio talks to nuxt.studio + content.nuxt.com)
- `frame-ancestors` is intentionally not set in the CSP, so default allows same-origin framing for Studio's preview

If you tighten the CSP later (remove `'unsafe-inline'` / restrict `connect-src`), test Studio again — adding back `'frame-ancestors': ["'self'", 'https://nuxt.studio', 'https://*.nuxt.studio', 'https://content.nuxt.com']` may also be needed.

**X-Frame-Options:** nuxt-security defaults to `SAMEORIGIN`, which is compatible with Studio's preview iframe (same origin). If Studio's cloud editor at nuxt.studio fails to embed, set `xFrameOptions: false` and rely on `frame-ancestors` only.

## Client Plugins

- `cookieFirst.client.ts` - Cookie consent (CookieFirst)
- `userback.client.ts` - User feedback widget (lazy-imported only when `NUXT_PUBLIC_USERBACK_TOKEN` is set)
- `scrollBehavior.client.ts` - Custom scroll behavior
- Zod error messages are localized by `useZodLocale()` (composable), called from each form that validates with Zod — not a plugin, so Zod stays out of the entry bundle

## Key Configuration

### Vue Components
- `<script setup lang="ts">` and Composition API
- Custom components prefixed with `C` (e.g., `CHeader`, `CFooter`, `CForm`)
- Nuxt UI components available globally

### Content Markdown
- Markdown files in `content/{locale}/`
- MDC components supported (e.g., `::UPageHero`, `::UContainer`)
- **Always use YAML syntax for MDC component props**:

```md
::UAlert
---
icon: i-lucide-triangle-alert
color: warning
title: Let op
description: Dit is voorbeeldinhoud.
---
::
```

Not inline attributes (`::UAlert{icon="..." color="..."}::`).

### Styling
- Tailwind CSS v4
- Custom CSS in `app/assets/css/main.css` and `prose.css`
- Theme customization in `app/app.config.ts` (primary: violet)

### Icons
- Iconify provider
- Custom logo collection in `app/assets/svg/logos/` (prefix: `logo:`)
- Auto-scanned client bundle for used icons
- `@iconify-json/lucide` is a **direct devDependency** (not just transitive) so Nuxt Icon can read the collection locally and bundle icons offline — without it, listed/scanned icons fall back to a build-time network fetch (`could not resolve` / `could not fetch` warnings).
- `@nuxt/ui` references its default lucide icons (arrows, chevrons, check, loading, …) from its component runtime, which `clientBundle.scan` can't see. They're listed explicitly in `icon.clientBundle.icons` in `nuxt.config.ts`. If a Nuxt UI upgrade adds new default icons, the "could not resolve" warning reappears with the new names — add them to that list.

### Linting + Formatting
Rules live in the shared `@wotzebra/oxc-config` package (installed from `github:wotzebra/oxc-config`). Project configs only pass overrides — change shared rules upstream, then `pnpm update @wotzebra/oxc-config`.
- **Oxlint** (`oxlint.config.ts`) - fast linter, replaces most ESLint rules (`withNuxt(oxlintConfig())`)
- **Oxfmt** (`oxfmt.config.ts`) - fast formatter (`printWidth: 120`, tabs, single quotes, `singleAttributePerLine`). Ignores (`package.json`, lockfiles, `*.md`) come from the shared config; `server/db/migrations` is added locally. No `.oxfmtignore`.
- `docs/` (Docus site) and `presentation/` (Slidev) are separate projects with their own `package.json` — all three root configs ignore them.
- **ESLint** (`eslint.config.mjs`) - kept only for stylistic Vue rules that oxlint doesn't cover (`eslintConfigs({ oxlint })`).

## Testing

Vitest with two projects in `vitest.config.ts`:
- **`unit`** (`test/unit/**/*.test.ts`) — plain Node, fast. Pure logic and server helpers. Nitro's auto-imports (`createError`, `$fetch`, `useRuntimeConfig`, …) don't exist there: stub them per test with `vi.stubGlobal`. Import app code via `@/…` and server code via `@@/server/…`.
- **`nuxt`** (`test/nuxt/**/*.test.ts`) — runs inside a real Nuxt app (`@nuxt/test-utils`, happy-dom). Auto-imports work; mount components with `mountSuspended`. Composables that need a component context run inside a tiny `defineComponent`.

`test/**/*` and `shared/**/*` are in the root `tsconfig.json` include, so `pnpm run lint` type-checks tests too. Run `npx nuxt prepare` if a test can't find a freshly added auto-import. Import components in tests from `#components` (the type-checker can't resolve `.vue` imports). Don't add `compilerOptions.paths` to the root `tsconfig.json`: it replaces every alias Nuxt generates (`#components`, `#imports`, `~`, `#auth-utils`…) instead of adding to them — Nuxt already generates `@/*` and `@@/*`.

## Code Quality Standards

- Strictly type-safe TypeScript
- Check array access by index to avoid undefined
- `<script setup lang="ts">` + Composition API for Vue components
- Clear, descriptive names
- Functions under 50 lines; extract complex logic
- Comments only for non-obvious WHY
- Primary goal: stability, speed, great UX

## Environment Variables

Three categories. The full annotated reference lives in `.env.example`.

### A. Build-time (public, baked into client bundle)

Read during `nuxt build` and embedded into the client JavaScript. **Visible to anyone viewing site source** — only non-sensitive values belong here.

| Variable | Purpose |
|---|---|
| `NUXT_SITE_ENV` | `production` \| `staging` — controls robots.txt |
| `NUXT_SITE_URL` | Public URL for SEO, sitemap, OG images |
| `NUXT_PUBLIC_TURNSTILE_SITE_KEY` | Public Turnstile site key |
| `NUXT_PUBLIC_USERBACK_TOKEN` | Optional Userback token |
| `NUXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` | Optional GTM container ID |

**Deployed:** set as **GitHub Actions repository variables** (`Settings → Secrets and variables → Actions → Variables`). Workflows in `.github/workflows/deploy-*.yml` pass them to `nuxt build`.

### B. Runtime secrets (server-only, sensitive)

Read by server endpoints at request time via `runtimeConfig`. Never put real values in committed files or GitHub variables.

| Variable | Purpose |
|---|---|
| `NUXT_SESSION_PASSWORD` | Session-cookie encryption (32+ random chars) |
| `NUXT_TURNSTILE_SECRET_KEY` | Server-side Turnstile verification |
| `NUXT_OG_IMAGE_SECRET` | OG image signing (`nuxt-og-image`) |
| `SEED_KEY` | Gate for `POST /api/seed` in non-dev |

**Deployed:** set as **Cloudflare Wrangler secrets**:
```bash
wrangler secret put NUXT_SESSION_PASSWORD              # production
wrangler secret put NUXT_SESSION_PASSWORD --env preview # preview
```

Worker env at runtime overrides any build-time defaults baked from `runtimeConfig`. Mirroring them as GitHub repo secrets is optional (just provides a build-time fallback default; Cloudflare always wins at runtime).

### C. CI/CD (deploy-only, not used by the app)

Used by GitHub Actions workflows for the `wrangler deploy` step.

| Variable | GitHub location | Purpose |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | **secret** | Wrangler deploy auth (Workers + D1 scope) |
| `CLOUDFLARE_ACCOUNT_ID` | **variable** | Target Cloudflare account |

### Local development

All three categories live together in `.env` (gitignored). Copy `.env.example` → `.env` and fill in test keys. The category split only matters for deployed environments.

## GitHub Actions

`.github/workflows/` contains deploy workflows that build and push to Cloudflare:
- `deploy-preview.yml` - on push to `preview` branch
- `deploy-preprod.yml` - on push to `preprod` branch
- `deploy-prod.yml` - on push to `main` branch (also triggered by `sanity-publish` repository_dispatch)

Each workflow:
1. Sets up pnpm + Node 24
2. `pnpm install`
3. `npx nuxt prepare`
4. `npm test` (Vitest) — a failing test stops the deploy
5. `npm run build` with build-time vars (Category A above) injected from GitHub repo variables
6. `npx wrangler deploy --config wrangler.jsonc [--env preview]` using `CLOUDFLARE_API_TOKEN` (secret) and `CLOUDFLARE_ACCOUNT_ID` (variable)

**Runtime secrets (Category B) are NOT set by GitHub** — they live as Cloudflare Wrangler secrets and are injected by Cloudflare at request time, independent of the deploy pipeline.

## Dependencies

Key packages:
- `drizzle-orm` + `drizzle-kit` - DB ORM
- `@paralleldrive/cuid2` - ID generation
- `xlsx` - Excel/CSV export
- `zod` - Schema validation

### Pinned: `satori` must match `nuxt-og-image`'s peer range

`nuxt-og-image@7` (via `@nuxtjs/seo@6`) declares `satori: ^0.47.1` as a peer and fails the build (`Satori X is not supported`) outside that range. Our direct `satori` devDependency is what gets hoisted, so keep it at `^0.47.1` — don't take `satori@latest`. When bumping `@nuxtjs/seo`, check `pnpm view nuxt-og-image@<version> peerDependencies` and move `satori` with it, then run `pnpm run build` to verify.

The build also logs `@nuxt/fonts 0.14.0 is not supported. Version 1.0.0+ is required for OG image font extraction.` `@nuxt/fonts` 0.14 comes from `@nuxt/ui`, so it can't be bumped independently. It's non-fatal and irrelevant while the app generates no OG images; it goes away once `@nuxt/ui` moves to `@nuxt/fonts@1`.
