import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@repo/utils": path.resolve(__dirname, "../../packages/utils/src/index.ts"),
      "@repo/ui-web": path.resolve(__dirname, "../../packages/ui-web/src/index.ts"),
      "@repo/test-utils": path.resolve(__dirname, "../../packages/test-utils/src/index.ts"),
    },
    dedupe: ["react", "react-dom", "zustand"],
  },
});
