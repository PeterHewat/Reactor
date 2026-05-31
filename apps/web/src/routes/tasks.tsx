import { createFileRoute } from "@tanstack/react-router";
import { BackendSetup } from "../components/backend-setup";
import { RequireAuth } from "../components/require-auth";
import { TasksPanel } from "../features/tasks";
import { isAuthEnabled } from "../lib/backend";

/**
 * Sample tasks page (Convex + Clerk when configured).
 */
function TasksPage() {
  if (!isAuthEnabled()) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center p-8">
        <BackendSetup />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-5rem)] max-w-3xl p-8">
      <RequireAuth>
        <TasksPanel />
      </RequireAuth>
    </main>
  );
}

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
});
