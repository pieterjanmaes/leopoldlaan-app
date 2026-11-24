---
seo:
  title: Leopoldlaan — Developer Docs
  description: Documentation for the Leopoldlaan renovation app — tasks, planning, floor plans, budget and Google Drive files for a household and its contractors.
---

::u-page-hero
---
orientation: horizontal
---
#title
Leopoldlaan

#description
A private app to run the renovation of our house: tasks on a board, a Gantt planning, a floor plan per floor, the budget with quotes and invoices, and the project files in Google Drive — shared with the household and, in a limited way, with contractors. Nuxt 4, Nuxt UI, Cloudflare Workers, D1 and Drizzle.

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
  to: /roadmap/app-ideas
  variant: outline
  ---
  Roadmap & advice
  :::
::

::u-page-section
---
title: What's inside
---
  ::::u-page-grid
    :::u-page-card
    ---
    icon: i-lucide-list-checks
    title: Tasks
    to: /features/tasks
    ---
    Kanban board and list, dependencies, comments, photos from the building site.
    :::

    :::u-page-card
    ---
    icon: i-lucide-calendar-range
    title: Planning
    to: /features/planning
    ---
    Gantt chart per phase with milestones and warnings when the order of work doesn't fit.
    :::

    :::u-page-card
    ---
    icon: i-lucide-map
    title: Floor plan
    to: /features/floor-plan
    ---
    A plan per floor with zones and pinned notes linked to rooms and tasks.
    :::

    :::u-page-card
    ---
    icon: i-lucide-wallet
    title: Budget
    to: /features/budget
    ---
    Budget lines, quotes, invoices and subsidies, with a forecast and contingency.
    :::

    :::u-page-card
    ---
    icon: i-lucide-hard-drive
    title: Google Drive
    to: /google-drive/setup
    ---
    One project folder in your own Drive; contractors need no Google account.
    :::

    :::u-page-card
    ---
    icon: i-lucide-users
    title: Roles & invites
    to: /users-and-roles/roles
    ---
    Owner, housemate and external — enforced on the server, not just in the UI.
    :::
  ::::
::
