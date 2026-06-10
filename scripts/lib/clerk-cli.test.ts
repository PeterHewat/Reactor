import { describe, expect, it } from "vitest";
import {
  extractClerkAppId,
  isClerkProductionMissingError,
  parseClerkAppRecords,
  parseClerkAppsList,
  parseClerkAppsListPlain,
} from "./clerk-cli";

describe("extractClerkAppId", () => {
  it("finds app IDs in plain text", () => {
    expect(extractClerkAppId("Linked application: app_2abc123xyz")).toBe("app_2abc123xyz");
  });

  it("returns undefined when absent", () => {
    expect(extractClerkAppId("not linked")).toBeUndefined();
  });
});

describe("isClerkProductionMissingError", () => {
  it("detects instance_not_found from Clerk CLI", () => {
    expect(isClerkProductionMissingError('{"error":"instance_not_found"}')).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isClerkProductionMissingError("network timeout")).toBe(false);
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

  it("parses application_id from Clerk platform API", () => {
    expect(
      parseClerkAppsList(JSON.stringify([{ application_id: "app_plat", name: "Reactor" }])),
    ).toEqual([{ id: "app_plat", name: "Reactor" }]);
  });
});

describe("parseClerkAppsListPlain", () => {
  it("parses the human-readable apps table", () => {
    expect(
      parseClerkAppsListPlain(`NAME     APP ID                           ENVIRONMENTS
Reactor  app_3ExutIX32r2LqwC9ikC2xKhlGfx  development

1 application`),
    ).toEqual([{ id: "app_3ExutIX32r2LqwC9ikC2xKhlGfx", name: "Reactor" }]);
  });
});

describe("parseClerkAppRecords", () => {
  it("parses applications wrapper and development publishable keys", () => {
    expect(
      parseClerkAppRecords(
        JSON.stringify({
          applications: [
            {
              application_id: "app_reactor",
              name: "Reactor",
              instances: [
                {
                  environment_type: "development",
                  publishable_key: "pk_test_mature",
                },
              ],
            },
          ],
        }),
      ),
    ).toEqual([
      {
        id: "app_reactor",
        name: "Reactor",
        slug: undefined,
        developmentPublishableKey: "pk_test_mature",
      },
    ]);
  });

  it("parses slug for Frontend API matching", () => {
    expect(
      parseClerkAppRecords(
        JSON.stringify([{ application_id: "app_md78", name: "Reactor", slug: "mature-dove-78" }]),
      ),
    ).toEqual([{ id: "app_md78", name: "Reactor", slug: "mature-dove-78" }]);
  });
});
