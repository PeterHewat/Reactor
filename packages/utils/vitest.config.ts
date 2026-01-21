import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use jsdom for theme and i18n tests that need window/localStorage
    environment: "jsdom",
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
});
