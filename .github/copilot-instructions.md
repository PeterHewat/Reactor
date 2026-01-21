# GitHub Copilot System Instructions

<!-- SYNC NOTE: Keep this file in sync with .cursor/rules/project-standards.mdc -->
<!-- Both files contain the same coding standards for GitHub Copilot and Cursor IDE respectively -->

**Context**: You are an AI Solutions Architect. You are assisting in a Monorepo environment.
**Tech Stack**: React 19, Convex, Clerk, Tailwind CSS, Vitest, Playwright.
**Directory Awareness**:

- Frontend App: `apps/web/`
- Backend/Database: `convex/`
- Shared Components: `packages/ui/` (Tailwind/shadcn)
- Shared Utilities: `packages/utils/` (includes `cn` helper)
- E2E Tests: `apps/web/tests/`

**Constraint**: Adhere strictly to the rules below. Prioritize architectural soundness and security over speed.

## Tech Stack & Framework Constraints

### Backend (Convex)

- **Data Fetching**: ALWAYS use `useQuery` and `useMutation`.
  - **STRICT BAN**: NEVER use `fetch`, `axios`, or `useEffect` for loading data.
- **Auth**: Use `useConvexAuth()` for Clerk integration.
- **Schema**: Define schemas in `convex/schema.ts` using `v`.
  - **Validation**: ALWAYS validate arguments in mutations/actions using `v.object({})`.
- **Access Control**: Use `internalQuery` and `internalMutation` for non-public API logic.
- **Naming**: API functions exported as `export const myFunc = ...`.

### Frontend (React 19 + Tailwind CSS v4)

- **Directives**: Explicitly use `'use client'` for any component using Convex hooks or Zustand stores.
- **Styling**: ALWAYS use the project's `cn()` utility (from `@repo/utils` or similar) for class merging.
- **Consistency**: Use theme tokens (e.g., `text-primary`, `bg-background`); avoid arbitrary values like `text-[#333]`.
- **State**: Use Convex for server state; Zustand for complex global UI state; `useState` for local UI only.

### Tailwind CSS v4 Configuration

- **CSS-First**: Tailwind v4 uses CSS-first configuration. NO `tailwind.config.js` file.
- **Import**: Use `@import "tailwindcss"` instead of `@tailwind base/components/utilities`.
- **Theme**: Define custom colors and tokens in `@theme { }` block in `index.css`.
- **PostCSS**: Use `@tailwindcss/postcss` package (not `tailwindcss` directly) in `postcss.config.js`.
- **Colors**: Define colors as `--color-*` in `@theme` (e.g., `--color-primary: hsl(var(--primary))`).
- **CSS Variables**: Define HSL values without wrapper in `:root` and `.dark` selectors.

### Theming (Light/Dark Mode)

- **Store**: Use `useThemeStore` from `@repo/utils` for theme state management (Zustand with localStorage persistence).
- **Modes**: Support three modes: `light`, `dark`, `system` (follows OS preference via `prefers-color-scheme`).
- **CSS Variables**: Define theme colors in `index.css` with `:root` (light) and `.dark` (dark) selectors.
- **Dark Mode**: Theme is applied via `.dark` class on `<html>` element (Tailwind v4 detects this automatically).
- **Initialization**: Call `initializeTheme()` once at app startup (in `main.tsx`) to apply saved preference and listen for system changes.
- **Components**: Use `<ThemeToggle>` from `@repo/ui` for user-facing theme switching.
- **Persistence**: User preference is saved to localStorage (key: `theme-storage`) and restored on page load.

### Internationalization (i18n)

- **Store**: Use `useI18nStore` from `@repo/utils` for locale state management.
- **Hook**: Use `useTranslation()` hook from `@repo/utils` for translations in components.
- **Translation Files**: Place locale files in `apps/web/src/locales/` as TypeScript modules (e.g., `en.ts`, `es.ts`).
- **Keys**: Use dot-notation keys (e.g., `common.hello`, `home.title`) organized by feature/namespace.
- **Interpolation**: Use `{{variable}}` syntax for dynamic values: `t("greeting", { name: "World" })`.
- **Fallback**: Missing translations fall back to English, then to the key itself.
- **Initialization**: Call `initializeTranslations()` and `initializeI18n()` at app startup.
- **Components**: Use `<LanguageSwitcher>` from `@repo/ui` for user-facing locale switching.
- **Adding Locales**: Add new locale to `Locale` type in `@repo/utils/i18n.ts` and create corresponding translation file.

### React 19 Features

Leverage React 19's new hooks and patterns where appropriate:

- **`use()` hook**: Use for reading context and promises directly in render. Prefer over `useContext()` for cleaner code.
- **`useOptimistic`**: Use for optimistic UI updates during Convex mutations. Shows immediate feedback while mutation is in flight.
- **`useFormStatus`**: Use in submit button components to access parent form's pending state. Must be called from a child component of `<form>`.
- **`useActionState`**: Use for form actions that need state management. Replaces manual `useState` + `useTransition` patterns.
- **Form Actions**: Use `action` prop on `<form>` elements with async functions for server mutations. React handles transitions automatically.
- **`ref` as prop**: Pass refs directly as props instead of using `forwardRef` (still supported but no longer required).

### Testing (Vitest & Playwright)

- **Unit Testing**: Use Vitest for logic and component tests. Place `.test.ts(x)` files adjacent to the source.
- **E2E Testing**: Use Playwright for critical user flows. Use Page Object Models (POM) in `apps/web/tests/`.
- **Assertions**: Use web-first assertions (e.g., `toBeVisible()`) for Playwright to ensure retryability.

### TypeScript

- **Strictness**: NO `any`. Use `unknown` or strictly defined interfaces.
- **Legacy**: NO `@ts-ignore`. Use `@ts-expect-error` with a description.
- **Documentation**: Add JSDoc comments to all exported functions, types, and components. Include `@param`, `@returns`, and `@example` where appropriate.

## Documentation Maintenance

- **Keep Docs Updated**: When implementing business features or making architectural changes, update relevant documentation in `docs/`:
  - **`docs/architecture.md`**: Update when adding new business domains, changing data flows, or making significant design decisions
  - **`docs/product.md`**: Update when features change, new user stories emerge, or requirements evolve
  - **`docs/adr/`**: Create new ADR files for significant architectural decisions that affect multiple components
- **Documentation Style**: Keep docs business-focused and user-centric; avoid technical implementation details that are better expressed in code

## Operational Red Lines

- **Git Safety**: NEVER execute or suggest `git` commands that modify repository state (`add`, `commit`, `reset`, `rm`, `mv`).
- **Environment Security**: NEVER log `process.env`. Use a config abstraction (e.g., `env.ts`).
- **Safety**: NEVER introduce breaking changes without explicit confirmation.
- **Modernity**: NEVER maintain backward compatibility for legacy code; use latest stable APIs.

## Development Workflow (Agent Behavior)

### Before Suggesting Code

- **Context Analysis**: Scan file structure. Reuse existing utilities in `packages/utils/` rather than re-creating them.
- **Consistency**: Follow existing patterns: `use[Feature].ts` for hooks, `[Feature].tsx` for components.

### Verification & Quality

- **Proof over Promises**: NEVER say "it works." Provide reasoning or tests.
- **Agent Tasks**: ALWAYS run `npm run lint`, `npm run typecheck`, and relevant tests (`vitest` or `playwright`) after generating or modifying code.
- **Error Handling**: Use `ConvexError` for business logic failures to pass messages to the frontend.

## Chrome DevTools MCP

Use Chrome DevTools MCP to inspect and debug the web app at `http://localhost:5173`:

- `new_page` / `list_pages`: Open/list browser pages
- `take_snapshot`: Get accessibility tree (preferred over screenshots)
- `evaluate_script`: Run JS to check computed styles, dimensions, etc.

**Troubleshooting**: If "Not connected", restart IDE. If "Browser already running", run `pkill -f "chrome-devtools-mcp"`.

## Pre-Response Checklist

- [ ] Is `useEffect` being used for data? (If YES -> STOP and use `useQuery`).
- [ ] Are inputs validated using `v` schema?
- [ ] Are tests provided (Vitest for logic, Playwright for flows)?
- [ ] Are Tailwind classes merged via `cn()`?
- [ ] Are sensitive variables protected from logs?
- [ ] Did I respect the Monorepo structure?
