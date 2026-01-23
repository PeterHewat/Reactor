# GitHub Copilot System Instructions

<!-- SYNC NOTE: Keep in sync with .cursor/rules/*.mdc -->

**Context**: Multi-platform Monorepo with Web (React 19), Mobile (React Native), Marketing (Astro), and Convex backend.

## Directory Structure

- `apps/web/` - React 19 + Vite + Tailwind CSS v4 + Zustand
- `apps/mobile/` - React Native CLI + NativeWind
- `apps/marketing/` - Astro + Tailwind CSS
- `convex/` - Backend (Convex + Clerk)
- `packages/ui-web/` - Web components (shadcn/Tailwind)
- `packages/ui-mobile/` - Mobile components (NativeWind)
- `packages/ui-astro/` - Astro utilities
- `packages/ui-shared/` - Design tokens and types
- `packages/utils/` - Shared utilities (cn, theme, i18n)

## Backend (Convex + Clerk)

- **Data Fetching**: ALWAYS use `useQuery`/`useMutation`. NEVER use `fetch`/`axios`/`useEffect` for data.
- **Auth**: Use `useConvexAuth()` for Clerk integration.
- **Schema**: Define in `convex/schema.ts` using `v`. ALWAYS validate arguments with `v.object({})`.
- **Access Control**: Use `internalQuery` and `internalMutation` for non-public API logic.
- **Errors**: Use `ConvexError` for business logic failures.

## State Management

- **Server State**: Convex (useQuery, useMutation)
- **Global UI State**: Zustand (theme, i18n, complex UI state)
- **Local UI State**: React useState

## TypeScript

- **Strictness**: NO `any`. Use `unknown` or defined interfaces.
- **Legacy**: NO `@ts-ignore`. Use `@ts-expect-error` with description.
- **Documentation**: JSDoc comments on all exports with `@param`, `@returns`, `@example`.

## Styling

- **Class Merging**: ALWAYS use `cn()` from `@repo/utils`.
- **Theme Tokens**: Use `text-primary`, `bg-background`, etc. Avoid arbitrary values like `text-[#333]`.

## Web Platform (React 19 + Tailwind v4)

- **Directives**: Use `'use client'` for components with Convex hooks or Zustand stores.
- **Tailwind v4**: CSS-first config. Use `@import "tailwindcss"`, define tokens in `@theme {}` block.
- **Components**: Import from `@repo/ui-web`.
- **React 19 Hooks**: Prefer `use()` over `useContext()`, use `useOptimistic` for mutations, `useFormStatus` in submit buttons.

## Mobile Platform (React Native + NativeWind)

- **Framework**: React Native CLI (not Expo)
- **Styling**: NativeWind for Tailwind-like styling
- **Platform Code**: Use `.ios.tsx`/`.android.tsx` suffixes
- **Components**: Import from `@repo/ui-mobile`
- **Navigation**: React Navigation

## Marketing Platform (Astro)

- **Framework**: Astro with static site generation
- **Content**: Use content collections for blog/docs
- **Components**: Import from `@repo/ui-astro`
- **SEO**: Leverage Astro's built-in meta tags, sitemap, RSS

## Theming

- **Store**: `useThemeStore` from `@repo/utils` (Zustand + localStorage)
- **Modes**: `light`, `dark`, `system`
- **Web**: `.dark` class on `<html>` element
- **Mobile**: React Native `Appearance` API

## Internationalization

- **Store**: `useI18nStore` from `@repo/utils`
- **Hook**: `useTranslation()` for translations
- **Keys**: Dot-notation (e.g., `home.title`)
- **Interpolation**: `{{variable}}` syntax

## Testing

- **Unit**: Vitest with `.test.ts(x)` files adjacent to source
- **Web E2E**: Playwright with Page Object Models in `apps/web/tests/`
- **Mobile E2E**: Detox (after React Native setup)
- **Assertions**: Use web-first assertions (e.g., `toBeVisible()`)

## Operational Red Lines

- **Git Safety**: NEVER execute git commands that modify state.
- **Environment Security**: NEVER log `process.env`.
- **Safety**: NEVER introduce breaking changes without confirmation.

## Verification

After changes, run:

- `npm run lint`
- `npm run typecheck`
- `npm test`

## Pre-Response Checklist

- [ ] Is `useEffect` used for data? (Use `useQuery` instead)
- [ ] Are inputs validated with `v` schema?
- [ ] Are Tailwind classes merged via `cn()`?
- [ ] Am I using the correct platform package (`ui-web`, `ui-mobile`, `ui-astro`)?
- [ ] Are sensitive variables protected from logs?
