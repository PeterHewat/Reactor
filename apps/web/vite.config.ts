import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@repo/utils": path.resolve(__dirname, "../../packages/utils/src/index.ts"),
      "@repo/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
    },
  },
});
