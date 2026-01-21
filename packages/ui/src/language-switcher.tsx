"use client";

import { cn } from "@repo/utils";
import { SUPPORTED_LOCALES, useI18nStore, type Locale } from "@repo/utils";
import type { Ref, SelectHTMLAttributes } from "react";

/**
 * Props for the LanguageSwitcher component.
 */
export interface LanguageSwitcherProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children" | "value" | "onChange" | "size"
> {
  /** Ref to the select element */
  ref?: Ref<HTMLSelectElement>;
  /** Size of the switcher */
  size?: "sm" | "md" | "lg";
  /** Show full language names or just codes */
  showFullName?: boolean;
  /** Custom locale labels (overrides SUPPORTED_LOCALES) */
  localeLabels?: Partial<Record<Locale, string>>;
}

const sizeClasses = {
  sm: "h-8 px-2 text-sm",
  md: "h-10 px-3 text-base",
  lg: "h-12 px-4 text-lg",
};

/**
 * A dropdown select for switching between supported locales.
 *
 * @example
 * // Basic usage
 * <LanguageSwitcher />
 *
 * @example
 * // Show locale codes only
 * <LanguageSwitcher showFullName={false} />
 *
 * @example
 * // Custom labels
 * <LanguageSwitcher localeLabels={{ en: "English (US)", es: "Spanish" }} />
 */
export function LanguageSwitcher({
  className,
  size = "md",
  showFullName = true,
  localeLabels,
  ref,
  ...props
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18nStore();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(event.target.value as Locale);
  };

  const getLabel = (loc: Locale): string => {
    if (localeLabels?.[loc]) return localeLabels[loc];
    if (showFullName) return SUPPORTED_LOCALES[loc];
    return loc.toUpperCase();
  };

  return (
    <select
      ref={ref}
      value={locale}
      onChange={handleChange}
      className={cn(
        "border-border bg-background text-foreground rounded-md border transition-colors",
        "hover:bg-secondary hover:text-secondary-foreground",
        "focus-visible:ring-ring focus:outline-none focus-visible:ring-2",
        "cursor-pointer appearance-none",
        sizeClasses[size],
        className,
      )}
      aria-label="Select language"
      {...props}
    >
      {(Object.keys(SUPPORTED_LOCALES) as Locale[]).map((loc) => (
        <option key={loc} value={loc}>
          {getLabel(loc)}
        </option>
      ))}
    </select>
  );
}
