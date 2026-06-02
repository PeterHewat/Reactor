import { defineConfig } from "vitest/config";
import { createRepoAliases, uiWebAliasKeys } from "../config/aliases";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./setupTests.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/dist/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts", "src/index.ts", "src/**/*.stories.tsx"],
      thresholds: {
        lines: 45,
        functions: 45,
        branches: 35,
        statements: 45,
      },
    },
  },
  resolve: {
    alias: createRepoAliases(uiWebAliasKeys),
  },
});
