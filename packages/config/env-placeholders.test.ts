import { describe, expect, it } from "vitest";
import { isPlaceholderEnvValue, isRealConvexDeployment } from "./env-placeholders";

describe("isPlaceholderEnvValue", () => {
  it("flags template values", () => {
    expect(isPlaceholderEnvValue("dev:your-project-name")).toBe(true);
    expect(isPlaceholderEnvValue("pk_test_your-key-here")).toBe(true);
  });

  it("accepts real values", () => {
    expect(isPlaceholderEnvValue("https://happy-animal-123.convex.cloud")).toBe(false);
  });
});

describe("isRealConvexDeployment", () => {
  it("rejects placeholders", () => {
    expect(isRealConvexDeployment("dev:your-project-name")).toBe(false);
  });

  it("accepts linked deployment slugs", () => {
    expect(isRealConvexDeployment("dev:happy-animal-123")).toBe(true);
  });
});
