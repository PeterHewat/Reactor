import { defineConfig } from "vitest/config";
import { createRepoAliases, dedupeReact, utilsAliasKeys } from "../config/aliases";

export default defineConfig({
  test: {
    environment: "happy-dom",
    execArgv: ["--disable-warning=ExperimentalWarning"],
    globals: true,
    setupFiles: ["./setupTests.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/dist/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts", "src/index.ts"],
    },
  },
  resolve: {
    alias: createRepoAliases(utilsAliasKeys),
    dedupe: [...dedupeReact],
  },
});
