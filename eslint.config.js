import eslintReact from "@eslint-react/eslint-plugin";
import eslint from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      ...eslintReact.configs.recommended.plugins,
      prettier: prettierPlugin,
    },
    rules: {
      ...eslintReact.configs.recommended.rules,
      ...prettierConfig.rules,
      "prettier/prettier": "error",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "warn",
    },
  },
  {
    files: ["convex/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@repo/*"],
              message:
                "Convex must not import workspace packages (ADR-002). Use convex/lib/ and keep server code in convex/.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/.astro/**",
    "convex/_generated/**",
    ".agents/skills/convex/**",
    ".agents/skills/convex-*/**",
    ".agents/skills/clerk-*/**",
  ]),
);
