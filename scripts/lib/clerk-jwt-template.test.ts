import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLERK_CONVEX_JWT_CLAIMS,
  CLERK_CONVEX_JWT_TEMPLATE_NAME,
  ensureClerkConvexJwtTemplate,
  hasClerkConvexJwtTemplate,
} from "./clerk-jwt-template.ts";

describe("hasClerkConvexJwtTemplate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when convex template exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          data: [{ name: "other" }, { name: CLERK_CONVEX_JWT_TEMPLATE_NAME }],
        }),
      ),
    );

    await expect(hasClerkConvexJwtTemplate("sk_test_fixture")).resolves.toBe(true);
  });

  it("returns false when convex template is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data: [{ name: "other" }] })),
    );

    await expect(hasClerkConvexJwtTemplate("sk_test_fixture")).resolves.toBe(false);
  });
});

describe("ensureClerkConvexJwtTemplate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips create when template already exists", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [{ name: CLERK_CONVEX_JWT_TEMPLATE_NAME }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await ensureClerkConvexJwtTemplate("sk_test_fixture");
    expect(result).toEqual({ ok: true, created: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("treats name-taken create errors as success when list missed the template", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith("https://api.clerk.com/v1/jwt_templates") && init?.method !== "POST") {
        return Response.json({ data: [], total_count: 0 });
      }
      if (url === "https://api.clerk.com/v1/jwt_templates" && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            errors: [{ code: "form_identifier_exists", message: "That name is taken." }],
          }),
          { status: 422 },
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await ensureClerkConvexJwtTemplate("sk_test_fixture");
    expect(result).toEqual({ ok: true, created: false });
  });

  it("creates convex template with preset claims", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith("https://api.clerk.com/v1/jwt_templates") && init?.method !== "POST") {
        return Response.json({ data: [], total_count: 0 });
      }
      if (url === "https://api.clerk.com/v1/jwt_templates" && init?.method === "POST") {
        const body = JSON.parse(String(init.body)) as {
          name: string;
          claims: Record<string, string>;
        };
        expect(body.name).toBe(CLERK_CONVEX_JWT_TEMPLATE_NAME);
        expect(body.claims).toEqual(CLERK_CONVEX_JWT_CLAIMS);
        return Response.json({ id: "jwt_template_new" });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await ensureClerkConvexJwtTemplate("sk_test_fixture");
    expect(result).toEqual({ ok: true, created: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
