import { describe, expect, test } from "vitest";
import {
  defaultE2eClerkEmail,
  E2E_CLERK_EMAIL_WITHOUT_APEX,
  isPlaceholderE2EClerkEmail,
} from "./e2e-clerk";

describe("defaultE2eClerkEmail", () => {
  test("derives e2e.test@ from apex domain", () => {
    expect(defaultE2eClerkEmail("foobar.com")).toBe("e2e.test@foobar.com");
  });

  test("normalizes apex input", () => {
    expect(defaultE2eClerkEmail("  FOOBAR.COM. ")).toBe("e2e.test@foobar.com");
  });

  test("uses a generic fallback when apex is not configured", () => {
    expect(defaultE2eClerkEmail()).toBe(E2E_CLERK_EMAIL_WITHOUT_APEX);
    expect(defaultE2eClerkEmail("")).toBe(E2E_CLERK_EMAIL_WITHOUT_APEX);
  });
});

describe("isPlaceholderE2EClerkEmail", () => {
  test("flags template and empty values", () => {
    expect(isPlaceholderE2EClerkEmail(undefined)).toBe(true);
    expect(isPlaceholderE2EClerkEmail("")).toBe(true);
    expect(isPlaceholderE2EClerkEmail("e2e.test@your-apex-domain")).toBe(true);
  });

  test("accepts setup fallback and apex-derived addresses", () => {
    expect(isPlaceholderE2EClerkEmail(E2E_CLERK_EMAIL_WITHOUT_APEX)).toBe(false);
    expect(isPlaceholderE2EClerkEmail("e2e.test@foobar.com")).toBe(false);
  });
});
