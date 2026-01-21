import { describe, expect, it } from "vitest";
import { cn } from "./index";

describe("cn", () => {
  it("merges simple strings", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("handles numbers and falsy values", () => {
    expect(cn("a", 1, 0, false, null, undefined)).toBe("a 1 0");
  });

  it("flattens nested arrays", () => {
    expect(cn(["a", ["b", ["c"]]])).toBe("a b c");
  });

  it("expands object boolean map to keys", () => {
    expect(cn({ a: true, b: false, c: true })).toBe("a c");
  });

  it("combines mixed inputs predictably", () => {
    const result = cn("btn", ["btn-primary", { disabled: false, active: true }], { rounded: true });
    // Note: tailwind-merge doesn't dedupe non-Tailwind classes like "btn"
    expect(result).toBe("btn btn-primary active rounded");
  });

  it("keeps duplicate non-Tailwind classes (tailwind-merge behavior)", () => {
    // tailwind-merge only dedupes Tailwind utility classes, not custom classes
    const result = cn("btn", "btn");
    expect(result).toBe("btn btn");
  });

  // Tailwind-merge specific tests
  it("resolves conflicting Tailwind padding classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("p-2", "px-4")).toBe("p-2 px-4"); // Different axes don't conflict
  });

  it("resolves conflicting Tailwind color classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("resolves conflicting Tailwind spacing classes", () => {
    expect(cn("m-2", "m-4")).toBe("m-4");
    expect(cn("mt-2", "mt-4")).toBe("mt-4");
  });

  it("resolves conflicting Tailwind flex classes", () => {
    expect(cn("flex-row", "flex-col")).toBe("flex-col");
    expect(cn("justify-start", "justify-center")).toBe("justify-center");
  });

  it("preserves non-conflicting Tailwind classes", () => {
    expect(cn("p-2", "m-4", "text-red-500")).toBe("p-2 m-4 text-red-500");
  });

  it("handles complex Tailwind class combinations", () => {
    const result = cn(
      "px-4 py-2 bg-blue-500 text-white",
      "hover:bg-blue-600",
      { "opacity-50": true, "cursor-not-allowed": true },
      "px-6", // Should override px-4
    );
    expect(result).toBe(
      "py-2 bg-blue-500 text-white hover:bg-blue-600 opacity-50 cursor-not-allowed px-6",
    );
  });
});
