import { describe, expect, test } from "bun:test";
import { productNameToSlug } from "./repo-identity";

describe("Convex project slug from setup", () => {
  test("maps product name Reactor to reactor slug", () => {
    expect(productNameToSlug("Reactor")).toBe("reactor");
  });
});
