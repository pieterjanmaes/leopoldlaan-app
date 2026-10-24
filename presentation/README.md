# WOTZ Nuxt Starter — Presentation

A [Slidev](https://sli.dev) deck about the project, intended for onboarding sessions and tech talks (~25-30 min).

## Run locally

```bash
cd presentation
pnpm install
pnpm run dev
# → opens http://localhost:3030 in the browser
```

## Keyboard shortcuts

| Key | Action |
|---|---|
| `→` / `space` | Next slide |
| `←` | Previous slide |
| `o` | Slide overview |
| `d` | Toggle dark/light |
| `f` | Fullscreen |
| `g` | Jump to slide... |

Open the presenter view with the link at the bottom-right (laptop screen shows notes + next slide, projector shows current slide).

## Export to PDF

```bash
pnpm run export
# → outputs slides-export.pdf
```

Useful for sharing async with colleagues who can't make the live talk.

## Adding screenshots

Drop image files into `public/screenshots/` and reference them with `/screenshots/foo.png` in `slides.md`. Placeholders in the deck reference paths that don't exist yet — add real screenshots over time.

## Editing slides

`slides.md` is the entire deck. Slides are separated by `---` (with no surrounding whitespace). Each slide can have its own frontmatter:

```md
---
layout: two-cols
---

# Slide title

::left::
Left column

::right::
Right column

<!--
Speaker notes go here as an HTML comment at the bottom of the slide.
-->
```

See [Slidev docs](https://sli.dev/guide/) for layouts and components.
