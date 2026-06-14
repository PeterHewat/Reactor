---
name: pr-push
description: >-
  Commit staged work, push the branch, and create or update a GitHub pull request
  with release-note-ready title, description, and label. Use when the user asks
  to create or update a PR, ship work, push a PR, or open a pull request.
disable-model-invocation: true
---

# PR Push

Commit staged work, push the branch, and create or update a GitHub PR with release-note-ready title, description, and label. The user squash-merges after CI passes; title, body, and label feed GitHub release notes ([release.yml](../../../.github/release.yml)).

When this skill is invoked, it overrides generic PR workflows (including user-level create-PR rules).

Examples: [examples.md](examples.md).

## Hard rules

- Never discard user work. No destructive git commands without explicit user request.
- **Staged index for commits** — commit only what is already staged. Do not run `git add` unless the user explicitly asks.
- **Stage before you run** — everything that belongs in the PR must be staged before invoking this skill. Unstaged work on the branch is not committed and not described.
- Do not push to `main` / `master`. Work lands on a feature branch and enters `main` via squash merge.
- Do not run `bun run verify` or `bun run check` — the user is expected to have verified already before opening a PR.
- Never include "Made with Cursor" (or similar Cursor attribution) in the PR body. Cursor may inject it on `gh pr create`; re-apply the drafted description with `gh pr edit` after create (see [Push and publish PR](#push-and-publish-pr)).
- No test-plan section in the PR body — squash-merge release notes use title and body; keep copy release-note-ready.

## 1. Preflight

Run in parallel:

```bash
git status
git diff --cached
git log --oneline -10
git branch --show-current
git rev-list --count main..HEAD 2>/dev/null || git rev-list --count master..HEAD
gh pr view --json url,number,title,labels 2>/dev/null || true
```

Set `base` to `main` (fallback `master`). Set `existing_pr` when `gh pr view` succeeds for the current branch.

### What to ship

Stop when there is nothing meaningful to ship: no staged diff **and** the branch is not ahead of `base` (`git rev-list --count base..HEAD` is 0).

| Situation                                              | Commit                | Draft title/body/label from                                                    |
| ------------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------ |
| New PR                                                 | Staged index (if any) | `git diff --cached` + session context                                          |
| Open PR on this branch                                 | Staged index (if any) | `git diff base...HEAD` + session context — cover **all** commits on the branch |
| Branch ahead of `base`, no open PR yet, nothing staged | Skip commit           | `git diff base...HEAD` + session context                                       |

Rows two and three share the same draft source when the branch has commits; row two also publishes new staged commits.

Chat history may add intent beyond the diff.

### Re-invoke and follow-up runs

**Always run the full [Preflight](#1-preflight) on every invocation** — including when the user invokes the skill again in the same chat, when you already created or updated a PR earlier in the session, or when you believe nothing changed.

**Never** reply that state is unchanged, that a PR already exists, or that no action is needed **without** running preflight commands in this turn and applying the [What to ship](#what-to-ship) stop rule.

When an open PR exists on the current branch (`existing_pr` is set):

1. Draft title, body, and label from **`git diff base...HEAD`**, not from `git diff --cached`, the latest commit message, or chat memory alone.
2. **Always** run the [Existing PR](#push-and-publish-pr) `gh pr edit` block after push — even when the only new work was an extra commit, when metadata looks stale, or when the user only asked to "update the PR".
3. Do **not** narrow the title or body to the latest commit; squash-merge release notes must reflect the **whole branch**.

If preflight shows nothing to ship (no staged diff and branch not ahead of `base`), report that and stop — do not skip preflight.

## 2. Draft title, description, and label

Draft from the [preflight scope table](#what-to-ship), then continue to [Execute](#3-execute).

### Title

- One short line (ideally under ~72 characters)
- States the **why or outcome** — problem solved or behavior improved — not **how** (no tools, packages, APIs, or implementation verbs like "Add" / "Refactor")
- Sentence case; no trailing period
- No ticket IDs, branch names, or `WIP` prefixes

Good: `Continue release flow when E2E is skipped`
Avoid: `Add always() to release and deploy gates`

### Description

Write for squash-merge release notes: the PR body becomes the merge commit message and feeds GitHub release generation.

- Open with **why** — motivation, problem solved, or user-visible outcome in one sentence
- Bullets describe **outcomes and behavior**, not implementation steps, file paths, or mechanics; avoid leading every bullet with "Add …" / "Fix …" when that names how rather than what users gain
- Group related bullets into **short paragraphs** with an optional one-line theme heading (plain text, not markdown `##` unless you prefer headings in release notes)
- Omit refactors, formatting, and agent churn unless they matter to reviewers or release notes
- Mention tests only when new behavior is covered or a gap is intentional
- Do not list gitignored generated output (e.g. `convex/_generated/`, `routeTree.gen.ts`)

```markdown
<Why — problem solved or outcome in one sentence.>

<Theme — optional short line>

- <Outcome bullet>
- <Outcome bullet>
```

### Label

Apply **one** primary label. Names must match [sync-labels.yml](../../../.github/workflows/sync-labels.yml):

| Label                | When to use                                                                       |
| -------------------- | --------------------------------------------------------------------------------- |
| `enhancement`        | New feature or user-visible improvement                                           |
| `fix`                | Bug fix (preferred on pull requests)                                              |
| `breaking-change`    | Breaking API or behavior change                                                   |
| `security`           | Security fix or hardening                                                         |
| `documentation`      | Docs-only or primarily documentation                                              |
| `dependencies`       | Dependency version bumps in committed manifests                                   |
| `github-actions`     | GitHub Actions workflow changes                                                   |
| `chore`              | Internal or tooling work with no user-facing impact (excluded from release notes) |
| `test`               | Test-only changes (excluded from release notes)                                   |
| `ignore-for-release` | Ship to `main` but omit from generated release notes                              |

These labels are **mutually exclusive** primary categories — apply only one. On update, if the drafted label differs from the PR's current primary label, `--remove-label` the old one before or when adding the new one.

Prefer `fix` over `bug` on PRs. Do not apply Dependabot-only labels (`monorepo`, `typescript`) to agent-opened PRs.

## 3. Execute

Shell steps that push or call `gh` need git and network access (e.g. `required_permissions: ["git_write", "full_network"]` or `["all"]` in sandboxed agents).

### Branch

If current branch is `main` / `master`:

```bash
branch="${type}/${short-slug}"
if git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
  branch="${type}/${short-slug}-$RANDOM"
fi
git checkout -b "$branch"
```

Branch slug: lowercase, hyphenated, derived from the PR title (drop filler words; ~4 words max). Prefix by change type: `feat/`, `fix/`, `docs/` (documentation), or `chore/` (internal/tooling).

If already on a feature branch, stay on it.

### Commit

If there is a staged diff, commit the staged index as-is — do not `git add`. One commit is typical; use multiple commits only when the user asks.

**New PR** — title and full description in the commit message (matches squash-merge copy):

```bash
git commit -m "$(cat <<'EOF'
<drafted title>

<drafted description>
EOF
)"
```

**Existing PR** — title only in the commit message; full copy lives on the PR via `gh pr edit`:

```bash
git commit -m "<drafted title>"
```

If there is no staged diff but the branch is ahead of `base`, skip this step.

### Push and publish PR

```bash
git push -u origin HEAD
```

If push is rejected, stop and report — do not force-push unless the user explicitly asks.

**New PR** (`existing_pr` is empty):

```bash
gh pr create \
  --base "$base" \
  --title "<drafted title>" \
  --label "<drafted label>" \
  --assignee @me \
  --body "$(cat <<'EOF'
<drafted description>
EOF
)"

gh pr edit --body "$(cat <<'EOF'
<drafted description>
EOF
)"
```

Cursor may append `Made with [Cursor](https://cursor.com)` to the body passed to `gh pr create` (PR Attribution). The second `gh pr edit` removes it.

**Existing PR** (`existing_pr` is set) — push adds commits to the open PR; update metadata; do **not** run `gh pr create`:

```bash
gh pr edit \
  --title "<drafted title>" \
  --body "$(cat <<'EOF'
<drafted description>
EOF
)" \
  --remove-label "<previous primary label, if different>" \
  --add-label "<drafted label>"
```

Omit `--remove-label` when the primary label is unchanged.

If `gh pr create` fails because a PR already exists for the branch, run the **Existing PR** `gh pr edit` block instead.

Assign the PR author with `--assignee @me` on create only. Use an explicit login only when the user asks to assign someone else.

Label must exist in the repo (run [sync-labels.yml](../../../.github/workflows/sync-labels.yml) if missing).

## 4. Report back

Return the PR URL plus the label, title, and description used. Note whether the PR was created or updated. Remind the user:

1. Wait for PR CI ([ci.yml](../../../.github/workflows/ci.yml)) to pass.
2. Squash merge into `main`.
3. Create a GitHub release when ready — release notes use merged PR titles, bodies, and labels ([docs/ci-cd.md](../../../docs/ci-cd.md)).

Do not squash merge, delete the branch, or create a release unless the user asks.
