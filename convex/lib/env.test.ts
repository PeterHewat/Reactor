import { afterEach, expect, test } from "vitest";
import { requireEnv } from "./env";

const ENV_KEY = "TEST_REQUIRE_ENV_KEY";

afterEach(() => {
  delete process.env[ENV_KEY];
});

test("requireEnv returns trimmed value", () => {
  process.env[ENV_KEY] = "  https://issuer.example  ";
  expect(requireEnv(ENV_KEY)).toBe("https://issuer.example");
});

test("requireEnv throws when missing or blank", () => {
  expect(() => requireEnv(ENV_KEY)).toThrow(/Missing required environment variable/);
  process.env[ENV_KEY] = "   ";
  expect(() => requireEnv(ENV_KEY)).toThrow(/Missing required environment variable/);
});
