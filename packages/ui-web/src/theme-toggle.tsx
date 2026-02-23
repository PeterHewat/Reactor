"use client";

import { cn, useThemeStore, type ResolvedTheme } from "@repo/utils";
import type { ReactNode, Ref } from "react";
import { memo } from "react";
import { Button, type ButtonProps } from "./button";

/**
 * Props for the ThemeToggle component.
 */
export interface ThemeToggleProps extends Omit<ButtonProps, "children" | "size"> {
  /** Ref to the button element */
  ref?: Ref<HTMLButtonElement>;
  /** Size of the toggle button */
  size?: "sm" | "md" | "lg";
  /** Show label text next to icon */
  showLabel?: boolean;
  /** Labels for each theme mode */
  labels?: {
    light?: string;
    dark?: string;
  };
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
};

const sizeWithLabelClasses = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-5 text-lg",
};

/**
 * Icons for each theme mode.
 * Using simple SVG icons to avoid external dependencies.
 * Using Tailwind size utilities for consistent rendering.
 */
function ThemeIcon({ children, className }: { children: ReactNode; className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ThemeIcons = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  dark: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
};

const iconSizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const defaultLabels = {
  light: "Light",
  dark: "Dark",
};

/**
 * Get the next theme mode in the cycle: light -> dark -> light...
 */
function getNextMode(current: ResolvedTheme): ResolvedTheme {
  return current === "light" ? "dark" : "light";
}

/**
 * A button that toggles between light and dark.
 *
 * @example
 * // Icon only
 * <ThemeToggle />
 *
 * @example
 * // With label
 * <ThemeToggle showLabel />
 *
 * @example
 * // Custom labels
 * <ThemeToggle showLabel labels={{ light: "Claro", dark: "Oscuro" }} />
 */
export const ThemeToggle = memo(function ThemeToggle({
  className,
  size = "md",
  showLabel = false,
  labels = defaultLabels,
  ref,
  ...props
}: ThemeToggleProps) {
  const { resolvedTheme, setMode } = useThemeStore();

  const nextMode = getNextMode(resolvedTheme);

  const handleClick = () => {
    setMode(nextMode);
  };

  const mergedLabels = { ...defaultLabels, ...labels };
  const targetLabel = mergedLabels[nextMode];
  const iconClassName = iconSizeClasses[size];

  return (
    <Button
      ref={ref}
      type="button"
      onClick={handleClick}
      variant="ghost"
      size={size}
      className={cn(
        "border-border bg-background text-foreground gap-2 border",
        "hover:bg-secondary hover:text-secondary-foreground",
        "focus-visible:ring-ring focus:outline-none focus-visible:ring-2",
        showLabel ? sizeWithLabelClasses[size] : sizeClasses[size],
        className,
      )}
      aria-label={`Switch to ${targetLabel} theme.`}
      title={`Switch to ${targetLabel}`}
      {...props}
    >
      <ThemeIcon className={iconClassName}>{ThemeIcons[nextMode]}</ThemeIcon>
      {showLabel && <span>{targetLabel}</span>}
    </Button>
  );
});
