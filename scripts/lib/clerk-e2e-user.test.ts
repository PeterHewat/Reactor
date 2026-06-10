import { describe, expect, it } from "vitest";
import {
  isClerkEmailPasswordDisabledMessage,
  isClerkE2eUserAlreadyExistsMessage,
} from "./clerk-e2e-user";

describe("isClerkE2eUserAlreadyExistsMessage", () => {
  it("detects Clerk duplicate email errors", () => {
    expect(
      isClerkE2eUserAlreadyExistsMessage("That email address is taken. Please try another."),
    ).toBe(true);
  });
});

describe("isClerkEmailPasswordDisabledMessage", () => {
  it("detects disabled password strategy errors", () => {
    expect(isClerkEmailPasswordDisabledMessage("Password strategy is not enabled")).toBe(true);
  });
});
