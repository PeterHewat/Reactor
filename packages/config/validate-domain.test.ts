import { describe, expect, it } from "vitest";
import { isValidApexDomain, normalizeApexDomainInput } from "./validate-domain";

describe("normalizeApexDomainInput", () => {
  it("strips scheme and trailing dot", () => {
    expect(normalizeApexDomainInput("https://Example.com.")).toBe("example.com");
  });
});

describe("isValidApexDomain", () => {
  it("accepts apex domains", () => {
    expect(isValidApexDomain("example.com")).toBe(true);
    expect(isValidApexDomain("my-product.io")).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(isValidApexDomain("")).toBe(false);
    expect(isValidApexDomain("example")).toBe(false);
    expect(isValidApexDomain("www.example.com")).toBe(false);
    expect(isValidApexDomain("localhost")).toBe(false);
    expect(isValidApexDomain("https://example.com")).toBe(false);
  });
});
