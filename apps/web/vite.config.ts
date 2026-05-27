import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createRepoAliases, dedupeWebVite, webAliasKeys } from "../../packages/config/aliases";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: createRepoAliases(webAliasKeys),
    dedupe: [...dedupeWebVite],
  },
});
