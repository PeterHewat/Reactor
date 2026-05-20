import { describe, expect, it } from "vitest";
import { pageTitle, SITE_NAME } from "./site";

describe("pageTitle", () => {
  it("combines page title with site name", () => {
    expect(pageTitle("Blog")).toBe(`Blog | ${SITE_NAME}`);
  });
});
