// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://reactor.dev",

  vite: {
    // @ts-ignore - Type mismatch due to Vite version differences in monorepo
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});
