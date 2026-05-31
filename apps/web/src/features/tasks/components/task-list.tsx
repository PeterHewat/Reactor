"use client";

import { Button } from "@repo/ui-web";
import { cn, useTranslation } from "@repo/utils";
import type { Doc, Id } from "@convex/dataModel";

type Task = Doc<"tasks">;

/**
 * Props for {@link TaskList}.
 */
export interface TaskListProps {
  /** Tasks for the signed-in user */
  tasks: Task[];
  /** Toggle completion for a task */
  onToggle: (id: Id<"tasks">, completed: boolean) => void | Promise<void>;
  /** Delete a task */
  onDelete: (id: Id<"tasks">) => void | Promise<void>;
}

/**
 * Renders the user's task list with toggle and delete controls.
 *
 * @param props - Tasks and handlers
 */
export function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  const { t } = useTranslation();

  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-center text-sm">{t("tasks.empty")}</p>;
  }

  return (
    <ul className="space-y-2" aria-label={t("tasks.listLabel")}>
      {tasks.map((task) => (
        <li
          key={task._id}
          className="border-border bg-card flex items-center gap-3 rounded-md border px-3 py-2"
        >
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => void onToggle(task._id, task.completed)}
            aria-label={t("tasks.toggleComplete", { title: task.title })}
            className="border-input size-4 rounded"
          />
          <span
            className={cn("flex-1 text-sm", task.completed && "text-muted-foreground line-through")}
          >
            {task.title}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void onDelete(task._id)}
            aria-label={t("tasks.delete", { title: task.title })}
          >
            {t("common.delete")}
          </Button>
        </li>
      ))}
    </ul>
  );
}
