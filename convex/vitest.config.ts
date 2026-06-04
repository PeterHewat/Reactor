import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", "_generated/**"],
    server: { deps: { inline: ["convex-test"] } },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["**/*.ts"],
      exclude: ["**/*.test.ts", "**/_generated/**", "**/node_modules/**"],
    },
  },
});
