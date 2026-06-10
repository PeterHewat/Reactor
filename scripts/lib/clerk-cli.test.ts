import { describe, expect, it } from "vitest";
import { extractClerkAppId, parseClerkAppsList } from "./clerk-cli";

describe("extractClerkAppId", () => {
  it("finds app IDs in plain text", () => {
    expect(extractClerkAppId("Linked application: app_2abc123xyz")).toBe("app_2abc123xyz");
  });

  it("returns undefined when absent", () => {
    expect(extractClerkAppId("not linked")).toBeUndefined();
  });
});

describe("parseClerkAppsList", () => {
  it("parses array JSON", () => {
    expect(
      parseClerkAppsList(
        JSON.stringify([
          { id: "app_abc", name: "My App" },
          { id: "app_def", slug: "other" },
        ]),
      ),
    ).toEqual([
      { id: "app_abc", name: "My App" },
      { id: "app_def", name: "other" },
    ]);
  });

  it("parses wrapped data JSON", () => {
    expect(
      parseClerkAppsList(JSON.stringify({ data: [{ id: "app_wrap", name: "Wrapped" }] })),
    ).toEqual([{ id: "app_wrap", name: "Wrapped" }]);
  });
});
