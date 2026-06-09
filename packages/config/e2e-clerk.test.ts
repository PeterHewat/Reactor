import { describe, expect, test } from "vitest";
import { defaultE2eClerkEmail } from "./e2e-clerk";

describe("defaultE2eClerkEmail", () => {
  test("derives e2e.test@ from apex domain", () => {
    expect(defaultE2eClerkEmail("foobar.com")).toBe("e2e.test@foobar.com");
  });

  test("normalizes apex input", () => {
    expect(defaultE2eClerkEmail("  FOOBAR.COM. ")).toBe("e2e.test@foobar.com");
  });
});
