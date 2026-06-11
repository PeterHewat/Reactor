import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyClerkE2ESecrets } from "./e2e-secrets.ts";

const fixturePublishable = "unit-test-clerk-pub-fixture-01";
const fixtureSecret = "unit-test-clerk-sec-fixture-01";

describe("verifyClerkE2ESecrets", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an invalid secret key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === "https://api.clerk.com/v1/instance") {
          return new Response("Unauthorized", { status: 401 });
        }
        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const result = await verifyClerkE2ESecrets(fixturePublishable, fixtureSecret);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("CLERK_SECRET_KEY");
    }
  });

  it("rejects mismatched publishable and secret keys", async () => {
    const publishableKey = `pk_test_${Buffer.from("just-bulldog-13.clerk.accounts.dev").toString("base64")}`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === "https://api.clerk.com/v1/instance") {
          return Response.json({ frontend_api: "other-slug.clerk.accounts.dev" });
        }
        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const result = await verifyClerkE2ESecrets(publishableKey, fixtureSecret);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("different Clerk applications");
    }
  });

  it("rejects when testing token API is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === "https://api.clerk.com/v1/instance") {
          return Response.json({ frontend_api: "just-bulldog-13.clerk.accounts.dev" });
        }
        if (url === "https://api.clerk.com/v1/testing_tokens" && init?.method === "POST") {
          return new Response("Not Found", { status: 404 });
        }
        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const result = await verifyClerkE2ESecrets(fixturePublishable, fixtureSecret);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("testing token API returned 404");
    }
  });

  it("rejects when convex JWT template cannot be created", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === "https://api.clerk.com/v1/instance") {
          return Response.json({ frontend_api: "just-bulldog-13.clerk.accounts.dev" });
        }
        if (url === "https://api.clerk.com/v1/testing_tokens" && init?.method === "POST") {
          return Response.json({ token: "testing-token" });
        }
        if (url === "https://api.clerk.com/v1/jwt_templates" && init?.method === "POST") {
          return new Response("Forbidden", { status: 403 });
        }
        if (url.startsWith("https://api.clerk.com/v1/jwt_templates") && init?.method !== "POST") {
          return Response.json({ data: [], total_count: 0 });
        }
        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const result = await verifyClerkE2ESecrets(fixturePublishable, fixtureSecret);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('JWT template "convex"');
      expect(result.message).toContain("could not be created");
    }
  });

  it("creates convex JWT template when missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === "https://api.clerk.com/v1/instance") {
          return Response.json({ frontend_api: "just-bulldog-13.clerk.accounts.dev" });
        }
        if (url === "https://api.clerk.com/v1/testing_tokens" && init?.method === "POST") {
          return Response.json({ token: "testing-token" });
        }
        if (url === "https://api.clerk.com/v1/jwt_templates" && init?.method === "POST") {
          return Response.json({ id: "jwt_template_new", name: "convex" });
        }
        if (url.startsWith("https://api.clerk.com/v1/jwt_templates") && init?.method !== "POST") {
          return Response.json({ data: [], total_count: 0 });
        }
        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const result = await verifyClerkE2ESecrets(fixturePublishable, fixtureSecret);
    expect(result).toEqual({ ok: true, jwtTemplateCreated: true });
  });

  it("accepts matching keys when testing token API succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === "https://api.clerk.com/v1/instance") {
          return Response.json({ frontend_api: "just-bulldog-13.clerk.accounts.dev" });
        }
        if (url === "https://api.clerk.com/v1/testing_tokens" && init?.method === "POST") {
          return Response.json({ token: "testing-token" });
        }
        if (url.startsWith("https://api.clerk.com/v1/jwt_templates") && init?.method !== "POST") {
          return Response.json({ data: [{ name: "convex" }], total_count: 1 });
        }
        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const result = await verifyClerkE2ESecrets(fixturePublishable, fixtureSecret);
    expect(result).toEqual({ ok: true, jwtTemplateCreated: false });
  });
});
