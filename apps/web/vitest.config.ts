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
    include: ["src/**/*.test.{ts,tsx}", "tests/helpers/**/*.test.ts"],
    exclude: ["**/dist/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts", "src/main.tsx", "src/vite-env.d.ts"],
      thresholds: {
        lines: 33,
        functions: 35,
        branches: 10,
        statements: 33,
      },
    },
  },
  resolve: {
    alias: createRepoAliases(webAliasKeys),
    dedupe: [...dedupeReact],
  },
});
