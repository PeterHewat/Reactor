# Create PR — examples

Good title + description + label sets for squash-merge release notes.

## Regulatory (what/why vs how)

Distinguish **what/why** from **how** by removing implementation specifics from
title and description. Leading phrases like "using," "with," or "via" that name
tools, packages, or API versions qualify as how and should be stripped.

**Label:** `chore`

**Title:** Continue release flow when E2E is skipped

**Description:**

Ensure the CI pipeline progresses past gate/verify even when E2E is skipped.

- Prevent E2E skip from halting the entire pipeline by adding `always()` to
  release/deploy job conditions.

_Why good:_ describes the outcome (release flow continues). Not "Add `always()`"
which states how.

## Bug fix

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
