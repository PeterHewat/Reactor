# Marketing Site (Astro)

The marketing site is an Astro-based static site intended for product landing pages, documentation, and SEO-focused content.

**Stack:** [Astro 6](https://docs.astro.build/) + Vite 7 (bundled with Astro) + Tailwind CSS v4 via `@tailwindcss/vite`. The web app uses Vite 8 separately at the repo root.

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

- Tailwind CSS v4 via `@tailwindcss/vite` in `astro.config.mjs`.
- Theme tokens live in `tailwind.config.mjs` and `src/styles/`; align with the web app’s CSS variables where useful.

## Requirements

- Node.js **>= 24.0.0** (match repo `.node-version`; CI uses 24)

## Deployment (Vercel)

Astro outputs static assets to `dist/`. This template uses **Vercel** with `vercel.json` (monorepo install/build from repo root).

1. Create a Vercel project with root directory `apps/marketing`
2. Add `VERCEL_MARKETING_PROJECT_ID` to GitHub Actions secrets
3. Run the Release workflow (or Deploy with tag `marketing-v1.0.0`) — see [docs/ci-cd.md](../../docs/ci-cd.md)

See [docs/ci-cd.md](../../docs/ci-cd.md#vercel-web--marketing) for tokens and org ID.

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
