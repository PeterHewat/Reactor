import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ["src/**/*.integration.test.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  }),
);
