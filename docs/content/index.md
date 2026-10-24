---
seo:
  title: WOTZ Nuxt Starter — Developer Docs
  description: Documentation for the WOTZ Nuxt 4 starter template — multilingual, Cloudflare-deployed, with Studio, Drizzle, and a full admin dashboard.
---

::u-page-hero
---
orientation: horizontal
---
#title
WOTZ Nuxt Starter

#description
A production-ready Nuxt 4 starter by Who Owns The Zebra. Multilingual content (i18n + Nuxt Content), Nuxt UI v4, Cloudflare Workers deployment via NuxtHub, Drizzle ORM with D1, auth + admin dashboard, and Nuxt Studio for visual content editing.

#links
  :::u-button
  ---
  size: lg
  to: /getting-started/requirements
  ---
  Get started
  :::

  :::u-button
  ---
  color: neutral
  size: lg
  to: https://github.com/wotzebra/wotz-nuxt-starter
  variant: outline
  target: _blank
  ---
  GitHub
  :::
::

::u-page-section
---
title: What's inside
description: Everything wired up so you can start shipping features the same day you clone.
---
  ::::u-page-grid
    :::u-page-card
    ---
    icon: i-lucide-globe
    title: Multilingual content
    to: /i18n/overview
    ---
    `@nuxtjs/i18n` with locale-prefixed routes, one Nuxt Content collection per locale, and `canonicalId`-based translation linking.
    :::

    :::u-page-card
    ---
    icon: i-lucide-pen-tool
    title: Visual editing with Studio
    to: /content/nuxt-studio
    ---
    Edit markdown content in a browser UI. Floating button on every dev page; changes sync live to disk.
    :::

    :::u-page-card
    ---
    icon: i-lucide-database
    title: Drizzle + D1
    to: /database/schema-and-orm
    ---
    Type-safe schema, journaled migrations auto-applied on dev start, Drizzle Studio for local inspection.
    :::

    :::u-page-card
    ---
    icon: i-lucide-shield-check
    title: Auth + admin dashboard
    to: /auth-and-dashboard/sessions
    ---
    Session-based auth via `nuxt-auth-utils`, scrypt hashing, role guards, and a working `/dashboard` UI.
    :::

    :::u-page-card
    ---
    icon: i-lucide-cloud
    title: Cloudflare-deployed
    to: /deployment/cloudflare-and-wrangler
    ---
    NuxtHub + Wrangler. Three environments (preview / preprod / production) with GitHub Actions workflows ready.
    :::

    :::u-page-card
    ---
    icon: i-lucide-zap
    title: Oxlint + Oxfmt
    to: /development/linting-and-formatting
    ---
    Fast Rust-based lint and format, with ESLint kept only for Vue-specific stylistic rules.
    :::
  ::::
::
