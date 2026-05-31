"use client";

import { useTranslation } from "@repo/utils";
import { useTasks } from "../hooks/use-tasks";
import { TaskForm } from "./task-form";
import { TaskList } from "./task-list";

/**
 * Authenticated tasks feature shell: header, create form, and list.
 */
export function TasksPanel() {
  const { t } = useTranslation();
  const { tasks, createFromForm, toggleCompleted, deleteTask } = useTasks();

  if (tasks === undefined) {
    return (
      <p className="text-muted-foreground mt-24 text-center" role="status">
        {t("common.loading")}
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="mb-2 text-3xl font-bold">{t("tasks.title")}</h1>
      <p className="text-muted-foreground mb-8 text-sm">{t("tasks.subtitle")}</p>

      <TaskForm action={createFromForm} />
      <TaskList tasks={tasks} onToggle={toggleCompleted} onDelete={deleteTask} />
    </div>
  );
}
