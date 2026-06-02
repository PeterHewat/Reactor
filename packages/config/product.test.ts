import { describe, expect, it } from "vitest";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "./product";

describe("product", () => {
  it("exports non-empty defaults for the template", () => {
    expect(PRODUCT_NAME.length).toBeGreaterThan(0);
    expect(PRODUCT_TAGLINE.length).toBeGreaterThan(0);
  });
});
