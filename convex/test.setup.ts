/// <reference types="vite/client" />

/**
 * Convex function modules for convex-test (excludes tests and _generated).
 */
export const modules = import.meta.glob(["./schema.ts", "./tasks.ts", "./_generated/**/*.js"]);
