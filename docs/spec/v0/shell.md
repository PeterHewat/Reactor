# F-02: Theme + i18n shell

**Status:** Demo (starter)  
**Route:** `/`  
**Actor:** Visitor

## Acceptance criteria

- [x] Theme toggle persists preference (localStorage or in-memory fallback per [packages/utils/src/storage.ts](../../../packages/utils/src/storage.ts))
- [x] Language switcher lists locales defined in `@repo/utils/i18n`
- [x] Home route renders without Convex or Clerk

## Out of scope (starter)

- Per-locale routing URLs
- Server-side locale detection
