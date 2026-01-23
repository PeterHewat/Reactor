"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

/**
 * Props for the SubmitButton component.
 *
 * Extends ButtonProps but excludes type (always "submit") and isLoading (derived from form status).
 */
export interface SubmitButtonProps extends Omit<ButtonProps, "type" | "isLoading"> {
  /** Text to show while the form is submitting */
  pendingText?: string;
}

/**
 * A submit button that automatically shows loading state using React 19's useFormStatus.
 *
 * Must be used as a child of a `<form>` element with an `action` prop.
 * Automatically disables and shows pending state while the form is submitting.
 *
 * @example
 * // Basic usage with form action
 * <form action={submitAction}>
 *   <input name="email" type="email" />
 *   <SubmitButton>Subscribe</SubmitButton>
 * </form>
 *
 * @example
 * // With custom pending text
 * <form action={createUser}>
 *   <SubmitButton pendingText="Creating...">Create User</SubmitButton>
 * </form>
 *
 * @example
 * // With Convex mutation
 * const createTodo = useMutation(api.todos.create);
 * <form action={async (formData) => {
 *   await createTodo({ title: formData.get("title") as string });
 * }}>
 *   <SubmitButton>Add Todo</SubmitButton>
 * </form>
 */
export function SubmitButton({ children, pendingText, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" isLoading={pending} disabled={disabled || pending} {...props}>
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
