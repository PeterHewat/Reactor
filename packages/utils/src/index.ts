export type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | { [key: string]: boolean };

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
  return Array.from(new Set(parts)).join(" ");
}

export { asBoolean, asInt, asString, loadEnv } from "./env";
