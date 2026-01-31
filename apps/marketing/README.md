# Marketing Site (Astro)

The marketing site is an Astro-based static site intended for product landing pages, documentation, and SEO-focused content.

## Quick Start

From the repository root:

- Start dev server: `npm run -w apps/marketing dev`
- Build production assets: `npm run -w apps/marketing build`

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

- Tailwind CSS is configured at the app level.
- Use tokens and shared design language from packages when possible.

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
