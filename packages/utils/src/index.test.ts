import { describe, expect, it } from "vitest";
import { cn } from "./index";

describe("cn", () => {
  it("merges simple strings", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("dedupes classes", () => {
    expect(cn("a", "b", "a")).toBe("a b");
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
    const result = cn(
      "btn",
      ["btn-primary", { disabled: false, active: true }],
      { rounded: true },
      ["btn", ["btn-primary"]],
    );
    expect(result).toBe("btn btn-primary active rounded");
  });
});
