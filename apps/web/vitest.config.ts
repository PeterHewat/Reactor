import { defineConfig } from "vitest/config";
import { createRepoAliases, dedupeReact, webAliasKeys } from "../../packages/config/aliases";

export default defineConfig({
  test: {
    env: {
      VITE_CONVEX_URL: "https://test-project.convex.cloud",
    },
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./setupTests.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/dist/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts", "src/main.tsx", "src/vite-env.d.ts"],
    },
  },
  resolve: {
    alias: createRepoAliases(webAliasKeys),
    dedupe: [...dedupeReact],
  },
});
