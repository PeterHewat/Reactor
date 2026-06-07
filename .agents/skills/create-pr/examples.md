# Create PR — examples

Good title + description + label sets for squash-merge release notes.

## Feature

**Label:** `enhancement`

**Title:** Add task due dates with calendar picker

**Description:**

Add due-date support to tasks.

- Store optional `dueAt` on task documents with Convex schema validation
- Show due date on task cards and highlight overdue items
- Add date picker to the create/edit task form

Cover task model and UI with Vitest; extend Playwright task flow for due dates.

## Bug fix

**Label:** `fix`

**Title:** Fix sign-out redirect loop on expired session

**Description:**

Resolve redirect loop when Clerk session expires mid-navigation.

- Clear stale Convex auth token before redirecting to sign-in
- Preserve intended return path after re-authentication

## Dependencies

**Label:** `dependencies`

**Title:** Bump Vitest across the monorepo

**Description:**

Align Vitest and coverage packages on the latest 3.x release.

- Update root and workspace `package.json` overrides
- Adjust `vitest.config.ts` files for renamed coverage options
