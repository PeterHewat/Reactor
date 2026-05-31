# F-01 — Sample tasks

## Acceptance criteria

- Signed-in user can list only their own tasks (`convex/tasks.list`).
- User can create a task with a non-empty title (max 500 chars).
- User can toggle completion and delete owned tasks.
- Unauthenticated `list` / `create` / `update` / `remove` return not authenticated.
- Cross-user update/delete returns not authorized.

## UI (`/tasks`)

- Implemented under `apps/web/src/features/tasks/` (`useTasks`, `TaskForm`, `TaskList`, `TasksPanel`).
- Shows loading while `useQuery` is undefined.
- Empty state when no tasks.
- Form uses `SubmitButton` + React 19 form `action` for pending state.
- When `VITE_CONVEX_URL` or Clerk key missing, show backend setup instructions (no Convex hooks).

## API

| Function       | Type     | Auth required |
| -------------- | -------- | ------------- |
| `tasks.list`   | query    | yes           |
| `tasks.create` | mutation | yes           |
| `tasks.update` | mutation | yes           |
| `tasks.remove` | mutation | yes           |

## Edge cases

- Whitespace-only title → validation error.
- Title/description over max length → `ConvexError` with message.
