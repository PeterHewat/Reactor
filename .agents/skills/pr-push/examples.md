# PR push — examples

Good title + description + label sets for squash-merge release notes.

## Why vs how

Distinguish **why/outcome** from **how** by removing implementation specifics from title and description. Leading phrases like "using," "with," or "via" that name tools, packages, or API versions qualify as how and should be stripped.

**Label:** `chore`

**Title:** Continue release flow when E2E is skipped

**Description:**

Ensure the CI pipeline progresses past gate/verify even when E2E is skipped.

- Release and deploy jobs still run when earlier jobs skip E2E

_Why good:_ title and opener state the outcome (release flow continues). Avoid "Add `always()` to release and deploy gates" or bullets that name the mechanism.

## Feature

**Label:** `enhancement`

**Title:** Let users set task due dates

**Description:**

Users can assign due dates to tasks and see when work is overdue.

- Optional due date on task cards with overdue highlighting
- Date picker in create and edit forms

Cover task model and UI with Vitest; extend Playwright task flow for due dates.

## Bug fix

**Label:** `fix`

**Title:** Stop sign-out redirect loop on expired session

**Description:**

Resolve redirect loop when Clerk session expires mid-navigation.

- Stale Convex auth cleared before redirecting to sign-in
- Intended return path preserved after re-authentication

## Dependencies

**Label:** `dependencies`

**Title:** Keep Vitest on latest 3.x across the monorepo

**Description:**

Stay on supported Vitest 3.x with matching coverage packages across workspaces.

- Root and workspace overrides updated together
- Config files adjusted for renamed coverage options

## Update existing PR

Second run on `feat/task-due-dates` after a follow-up commit fixing overdue styling. **Run full preflight again** — do not assume the PR is already up to date because it was created earlier in the session. Draft from `git diff main...HEAD`, not just the latest staged slice or latest commit message. Commit message: title only. **Always** publish the full-branch title and body via `gh pr edit` after push.

**Wrong:** Re-invoke in the same chat → "PR #42 already exists; state unchanged."

**Wrong:** New commit pushed → `gh pr edit` title/body describe only that commit.

**Right:** Re-read `git diff main...HEAD`, merge outcomes from every commit on the branch into one title and description, then `gh pr edit`.

**Label:** `enhancement`

**Title:** Let users set task due dates

**Description:**

Users can assign due dates to tasks and see when work is overdue.

- Optional due date on task cards with overdue highlighting and accessible contrast
- Date picker in create and edit forms
