---
name: create-pr
description: >-
  Open a GitHub pull request from completed feature work. Use when the user asks
  to create a PR, ship work, open a pull request, or is ready to merge after
  agentic coding on main or a feature branch.
disable-model-invocation: true
---

# Create Pull Request

Turn completed work into a reviewable GitHub PR with release-note-ready title,
description, and label. The user squash-merges after CI passes; title, body, and
label feed GitHub release notes ([release.yml](../../../.github/release.yml)).

Examples: [examples.md](examples.md).

## Hard rules

- Do not create a branch, commit, push, or open a PR until the user approves the
  proposed title, description, and label.
- Never discard user work. No destructive git commands without explicit approval.
- **Staged index only** — draft, commit, and ship only what is already staged.
  Do not run `git add` unless the user explicitly asks. If nothing is staged,
  stop and ask the user to stage the files that belong in the PR.
- Do not push to `main` / `master`. Work lands on a feature branch and enters
  `main` via squash merge.
- Do not run `bun run verify` or `bun run check` — the user is expected to have
  verified already before opening a PR.
- Never include "Made with Cursor" (or similar Cursor attribution) in the PR body.
  Cursor may inject it when agents run `gh pr create`; always re-apply the
  approved description after create (see [Push and open PR](#push-and-open-pr)).

## 1. Preflight

Run in parallel:

```bash
git status
git diff --cached
git log --oneline -10
git branch --show-current
```

Use `git diff --cached` as the sole source of PR scope — ignore unstaged and
uncommitted work. Chat history may add intent beyond the staged diff.

Stop if there is no meaningful staged diff to ship.

Default base branch: `main` (fallback `master`).

## 2. Draft title, description, and label

Draft from the staged diff (`git diff --cached`) plus session context.

### Title

- One short line (ideally under ~72 characters)
- States **what** changed globally — not **how**
- Sentence case; no trailing period
- No ticket IDs, branch names, or `WIP` prefixes

Good: `Continue release flow when E2E is skipped`
Avoid: `Add always() to release and deploy gates`

### Description

Write for squash-merge release notes: the PR body becomes the merge commit
message and feeds GitHub release generation.

- **Imperative mood** — "Add …", "Fix …", "Remove …", "Update …"
- Describe **outcomes and user-visible behavior**, not implementation steps
- Group related bullets into **short paragraphs** with an optional one-line
  theme heading (plain text, not markdown `##` unless you prefer headings in
  release notes)
- Omit refactors, formatting, and agent churn unless they matter to reviewers or
  release notes
- Mention tests only when new behavior is covered or a gap is intentional
- Describe only **staged** changes — do not list gitignored generated output
  (e.g. `convex/_generated/`, `routeTree.gen.ts`)

```markdown
<One-sentence summary of the change.>

<Theme — optional short line>

- <Outcome bullet>
- <Outcome bullet>
```

### Label

Apply **one** primary label on `gh pr create --label`. Names must match
[sync-labels.yml](../../../.github/workflows/sync-labels.yml):

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

Prefer `fix` over `bug` on PRs. Do not apply Dependabot-only labels (`monorepo`,
`typescript`) to agent-opened PRs.

Present all three in chat:

```markdown
**Label:**
<single label name>

**Title:**
<one short line>

**Description:**
<grouped imperative paragraphs>
```

## 3. Approval loop

Use `AskQuestion` with:

- **Approve** — proceed to [Execute](#4-execute)
- **Revise**

On revise option, ask the user for their edits in chat, update the draft,
re-present title, description, and label, and ask again. Repeat until **Approve**.

Do not interpret casual assent in chat as approval unless they chose **Approve**
in `AskQuestion` or explicitly approved title, description, and label.

## 4. Execute

Only after approval.

### Branch

If current branch is `main` / `master`:

```bash
branch="${type}/${short-slug}"
if git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
  branch="${type}/${short-slug}-$RANDOM"
fi
git checkout -b "$branch"
```

Branch slug: lowercase, hyphenated, derived from the PR title (drop filler
words; ~4 words max). Prefix with `feat/`, `fix/`, or `chore/` by change type.

If already on a feature branch, stay on it.

### Commit

Commit the staged index as-is — do not `git add`. One commit is typical; use
multiple commits only when the user asks.

```bash
git commit -m "$(cat <<'EOF'
<approved title>

<approved description>
EOF
)"
```

### Push and open PR

```bash
git push -u origin HEAD
```

```bash
gh pr create \
  --title "<approved title>" \
  --label "<approved label>" \
  --assignee @me \
  --body "$(cat <<'EOF'
<approved description>
EOF
)"

gh pr edit --body "$(cat <<'EOF'
<approved description>
EOF
)"
```

Cursor may append `Made with [Cursor](https://cursor.com)` to the body passed to
`gh pr create` (PR Attribution). Re-run `gh pr edit` with the approved
description only so the published PR matches what the user approved.

Assign the PR author with `--assignee @me` (authenticated `gh` user). Use an
explicit login only when the user asks to assign someone else.

Use the same title, body, and label as approved. Label must exist in the repo
(run [sync-labels.yml](../../../.github/workflows/sync-labels.yml) if missing).
Base branch: `main` (or repo default).

## 5. Report back

Return the PR URL. Remind the user:

1. Wait for PR CI ([ci.yml](../../../.github/workflows/ci.yml)) to pass.
2. Squash merge into `main`.
3. Create a GitHub release when ready — release notes use merged PR titles,
   bodies, and labels ([docs/ci-cd.md](../../../docs/ci-cd.md)).

Do not squash merge, delete the branch, or create a release unless the user asks.
