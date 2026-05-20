# Marketing Site (Astro)

The marketing site is an Astro-based static site intended for product landing pages, documentation, and SEO-focused content.

**Stack:** [Astro 7 alpha](https://github.com/withastro/astro/releases) + Vite 8 (Rust compiler). Pin is intentional while the starter matures ahead of Astro 7 stable.

## Quick Start

From the repository root:

- Start dev server: `bun run --filter @repo/marketing dev`
- Build production assets: `bun run --filter @repo/marketing build`

## Project Structure

```text
apps/marketing/
	public/            # Static assets
	src/
		components/      # Marketing components
		layouts/         # Page layouts
		pages/           # Routes
		styles/          # Global styles
```

## Styling

- Tailwind CSS v4 via `@tailwindcss/vite` in `astro.config.mjs` (required for Vite 8; PostCSS-only setup fails on `@import "tailwindcss"`).
- Use tokens and shared design language from packages when possible.

## Requirements

- Node.js **>= 22.12.0** (Astro 7 alpha)

## Deployment

Astro outputs static assets to `dist/`. Deploy to any static host.

Common choices:

- Vercel
- Netlify
- Cloudflare Pages

## Notes

- Keep SEO metadata in page frontmatter and layout defaults.
- Prefer lightweight components and minimal client-side JS.

## Want to learn more?

- [Astro Documentation](https://docs.astro.build/)
- [Astro + Tailwind](https://docs.astro.build/en/guides/integrations-guide/tailwind/)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro SEO](https://docs.astro.build/en/guides/seo/)
- [Deploy Astro](https://docs.astro.build/en/guides/deploy/)
- [Discord Server](https://astro.build/chat)
