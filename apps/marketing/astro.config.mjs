// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  vite: {
    // @ts-ignore - Type mismatch due to Vite version differences in monorepo
    plugins: [tailwindcss()],
  },
});
