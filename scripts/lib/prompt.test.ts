import { describe, expect, it } from "vitest";
import { maskSecret } from "./prompt";

describe("maskSecret", () => {
  it("masks long secrets with head and tail", () => {
    expect(maskSecret("abcdefghijklmnop")).toBe("abcdefg…mnop");
  });

  it("returns ellipsis for short values", () => {
    expect(maskSecret("short")).toBe("…");
  });
});
