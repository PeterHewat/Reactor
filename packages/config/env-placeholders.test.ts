import { describe, expect, it } from "vitest";
import {
  isPlaceholderEnvValue,
  isRealConvexDeployment,
  parseDotenvAssignmentValue,
} from "./env-placeholders";

describe("isPlaceholderEnvValue", () => {
  it("flags template values", () => {
    expect(isPlaceholderEnvValue("dev:your-project-name")).toBe(true);
    expect(isPlaceholderEnvValue("pk_test_your-key-here")).toBe(true);
  });

  it("accepts real values", () => {
    expect(isPlaceholderEnvValue("https://happy-animal-123.convex.cloud")).toBe(false);
  });
});

describe("parseDotenvAssignmentValue", () => {
  it("strips inline comments from Convex CLI lines", () => {
    expect(parseDotenvAssignmentValue("dev:fantastic-toad-351 # team: acme")).toBe(
      "dev:fantastic-toad-351",
    );
  });
});

describe("isRealConvexDeployment", () => {
  it("rejects placeholders", () => {
    expect(isRealConvexDeployment("dev:your-project-name")).toBe(false);
  });

  it("accepts linked deployment slugs", () => {
    expect(isRealConvexDeployment("dev:happy-animal-123")).toBe(true);
  });

  it("accepts slugs with Convex CLI inline comments", () => {
    expect(isRealConvexDeployment("dev:happy-animal-123 # team: acme")).toBe(true);
  });
});
