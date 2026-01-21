import { twMerge } from "tailwind-merge";

/**
 * Represents a value that can be used as a CSS class.
 * Supports strings, numbers, booleans, arrays, and objects with boolean values.
 */
export type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | { [key: string]: boolean };

/**
 * Merges CSS class names, filtering out falsy values and intelligently
 * resolving Tailwind CSS class conflicts.
 *
 * Uses tailwind-merge under the hood to handle conflicting utility classes
 * (e.g., `cn("p-2", "p-4")` returns `"p-4"`, not `"p-2 p-4"`).
 *
 * @param classes - Class values to merge (strings, arrays, or objects)
 * @returns A single space-separated string of merged class names
 *
 * @example
 * cn("foo", "bar") // "foo bar"
 * cn("base", isActive && "active") // "base active" or "base"
 * cn("base", { active: true, disabled: false }) // "base active"
 * cn(["foo", "bar"], "baz") // "foo bar baz"
 * cn("p-2", "p-4") // "p-4" (tailwind-merge resolves conflicts)
 * cn("text-red-500", "text-blue-500") // "text-blue-500"
 */
export function cn(...classes: ClassValue[]): string {
  const toArray = (v: ClassValue): string[] => {
    if (v == null || v === false) return [];
    if (typeof v === "string" || typeof v === "number") return [String(v)];
    if (Array.isArray(v)) return v.flatMap(toArray);
    if (typeof v === "object") {
      return Object.entries(v)
        .filter(([, val]) => !!val)
        .map(([key]) => key);
    }
    return [];
  };

  const parts = classes.flatMap(toArray).filter(Boolean);
  return twMerge(parts.join(" "));
}

export { asBoolean, asInt, asString, loadEnv } from "./env";
