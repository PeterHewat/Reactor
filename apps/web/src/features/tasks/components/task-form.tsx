"use client";

import { SubmitButton } from "@repo/ui-web";
import { useTranslation } from "@repo/utils";

/**
 * Props for {@link TaskForm}.
 */
export interface TaskFormProps {
  /** React 19 form action receiving `FormData` */
  action: (formData: FormData) => void | Promise<void>;
}

/**
 * Create-task form using {@link SubmitButton} for pending state.
 *
 * @param props - Form action from {@link useTasks}
 */
export function TaskForm({ action }: TaskFormProps) {
  const { t } = useTranslation();

  return (
    <form action={action} className="mb-8 flex gap-2">
      <label className="sr-only" htmlFor="task-title">
        {t("tasks.newPlaceholder")}
      </label>
      <input
        id="task-title"
        name="title"
        type="text"
        required
        maxLength={500}
        placeholder={t("tasks.newPlaceholder")}
        className="border-input bg-background focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
      />
      <SubmitButton variant="primary" size="md" pendingText={t("common.loading")}>
        {t("tasks.add")}
      </SubmitButton>
    </form>
  );
}
