# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Deployment

Astro builds to static HTML by default, making it easy to deploy anywhere.

### Vercel

```bash
npx astro add vercel
```

### Netlify

```bash
npx astro add netlify
```

### Cloudflare Pages

```bash
npx astro add cloudflare
```

### Static Hosting

Build and deploy the `dist/` folder to any static host:

```bash
npm run build
# Upload dist/ to your host
```

## 👀 Want to learn more?

- [Astro Documentation](https://docs.astro.build/)
- [Astro + Tailwind](https://docs.astro.build/en/guides/integrations-guide/tailwind/)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro SEO](https://docs.astro.build/en/guides/seo/)
- [Deploy Astro](https://docs.astro.build/en/guides/deploy/)
- [Discord Server](https://astro.build/chat)
