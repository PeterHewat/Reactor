import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
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
    alias: {
      "@repo/utils": path.resolve(__dirname, "../../packages/utils/src/index.ts"),
      "@repo/ui-web": path.resolve(__dirname, "../../packages/ui-web/src/index.ts"),
      "@repo/test-utils": path.resolve(__dirname, "../../packages/test-utils/src/index.ts"),
    },
  },
});
