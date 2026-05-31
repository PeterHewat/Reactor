import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";
import { createRepoAliases, dedupeWebVite, webAliasKeys } from "../../packages/config/aliases";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      routeFileIgnorePattern: "\\.test\\.(ts|tsx)$",
    }),
    react(),
  ],
  resolve: {
    alias: createRepoAliases(webAliasKeys),
    dedupe: [...dedupeWebVite],
  },
});
