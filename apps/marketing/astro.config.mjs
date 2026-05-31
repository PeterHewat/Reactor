// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// https://astro.build/config
export default defineConfig({
  site: "https://reactor.dev",

  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@repo/tokens": path.resolve(repoRoot, "packages/tokens"),
      },
    },
  },
});
