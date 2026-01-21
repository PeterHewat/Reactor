"use client";

import { cn } from "@repo/utils";
import { useThemeStore, type ThemeMode } from "@repo/utils";
import type { ButtonHTMLAttributes, Ref } from "react";

/**
 * Props for the ThemeToggle component.
 */
export interface ThemeToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
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
    system?: string;
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
 * Using inline styles for dimensions to ensure they work across all Tailwind versions.
 */
const ThemeIcons = {
  light: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  dark: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  system: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
};

const defaultLabels = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

/**
 * Get the next theme mode in the cycle: light -> dark -> system -> light
 */
function getNextMode(current: ThemeMode): ThemeMode {
  const modes: ThemeMode[] = ["light", "dark", "system"];
  const currentIndex = modes.indexOf(current);
  return modes[(currentIndex + 1) % modes.length] as ThemeMode;
}

/**
 * A button that cycles through theme modes (light, dark, system).
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
 * <ThemeToggle showLabel labels={{ light: "Claro", dark: "Oscuro", system: "Sistema" }} />
 */
export function ThemeToggle({
  className,
  size = "md",
  showLabel = false,
  labels = defaultLabels,
  ref,
  ...props
}: ThemeToggleProps) {
  const { mode, setMode } = useThemeStore();

  const handleClick = () => {
    setMode(getNextMode(mode));
  };

  const mergedLabels = { ...defaultLabels, ...labels };
  const currentLabel = mergedLabels[mode];

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        "border-border bg-background text-foreground inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border transition-colors",
        "hover:bg-secondary hover:text-secondary-foreground",
        "focus-visible:ring-ring focus:outline-none focus-visible:ring-2",
        showLabel ? sizeWithLabelClasses[size] : sizeClasses[size],
        className,
      )}
      aria-label={`Current theme: ${currentLabel}. Click to switch theme.`}
      title={`Theme: ${currentLabel}`}
      {...props}
    >
      {ThemeIcons[mode]}
      {showLabel && <span>{currentLabel}</span>}
    </button>
  );
}
