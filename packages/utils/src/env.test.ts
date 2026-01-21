import { describe, expect, it } from "vitest";
import { asBoolean, asInt, asString, loadEnv } from "./env";

describe("asString", () => {
  it("returns the string value as-is", () => {
    expect(asString("hello")).toBe("hello");
    expect(asString("")).toBe("");
    expect(asString("  spaces  ")).toBe("  spaces  ");
  });
});

describe("asInt", () => {
  it("parses valid integers", () => {
    expect(asInt("42")).toBe(42);
    expect(asInt("0")).toBe(0);
    expect(asInt("-123")).toBe(-123);
  });

  it("parses integers with leading zeros", () => {
    expect(asInt("007")).toBe(7);
  });

  it("truncates decimal values", () => {
    expect(asInt("3.14")).toBe(3);
    expect(asInt("99.99")).toBe(99);
  });

  it("throws on invalid integers", () => {
    expect(() => asInt("abc")).toThrow("Invalid integer: abc");
    expect(() => asInt("")).toThrow("Invalid integer: ");
  });

  it("parses leading digits from mixed strings (parseInt behavior)", () => {
    // Note: parseInt("12abc") returns 12, this is expected JavaScript behavior
    expect(asInt("12abc")).toBe(12);
  });
});

describe("asBoolean", () => {
  it("parses true values", () => {
    expect(asBoolean("true")).toBe(true);
    expect(asBoolean("TRUE")).toBe(true);
    expect(asBoolean("True")).toBe(true);
    expect(asBoolean("1")).toBe(true);
  });

  it("parses false values", () => {
    expect(asBoolean("false")).toBe(false);
    expect(asBoolean("FALSE")).toBe(false);
    expect(asBoolean("False")).toBe(false);
    expect(asBoolean("0")).toBe(false);
  });

  it("handles whitespace", () => {
    expect(asBoolean("  true  ")).toBe(true);
    expect(asBoolean("  false  ")).toBe(false);
  });

  it("throws on invalid boolean strings", () => {
    expect(() => asBoolean("yes")).toThrow("Invalid boolean: yes");
    expect(() => asBoolean("no")).toThrow("Invalid boolean: no");
    expect(() => asBoolean("")).toThrow("Invalid boolean: ");
    expect(() => asBoolean("2")).toThrow("Invalid boolean: 2");
  });
});

describe("loadEnv", () => {
  it("loads required environment variables", () => {
    const source = { DATABASE_URL: "postgres://localhost/db" };
    const env = loadEnv(
      {
        dbUrl: { key: "DATABASE_URL", parse: asString },
      },
      source,
    );
    expect(env.dbUrl).toBe("postgres://localhost/db");
  });

  it("loads multiple variables with different parsers", () => {
    const source = {
      HOST: "localhost",
      PORT: "3000",
      DEBUG: "true",
    };
    const env = loadEnv(
      {
        host: { key: "HOST", parse: asString },
        port: { key: "PORT", parse: asInt },
        debug: { key: "DEBUG", parse: asBoolean },
      },
      source,
    );
    expect(env.host).toBe("localhost");
    expect(env.port).toBe(3000);
    expect(env.debug).toBe(true);
  });

  it("throws on missing required variables", () => {
    const source = {};
    expect(() =>
      loadEnv(
        {
          missing: { key: "MISSING_VAR", parse: asString },
        },
        source,
      ),
    ).toThrow("Missing required environment variable: MISSING_VAR");
  });

  it("treats empty string as missing", () => {
    const source = { EMPTY: "" };
    expect(() =>
      loadEnv(
        {
          empty: { key: "EMPTY", parse: asString },
        },
        source,
      ),
    ).toThrow("Missing required environment variable: EMPTY");
  });

  it("uses default value for optional missing variables", () => {
    const source = {};
    const env = loadEnv(
      {
        port: { key: "PORT", parse: asInt, optional: true, defaultValue: 8080 },
      },
      source,
    );
    expect(env.port).toBe(8080);
  });

  it("uses default value for optional empty variables", () => {
    const source = { PORT: "" };
    const env = loadEnv(
      {
        port: { key: "PORT", parse: asInt, optional: true, defaultValue: 8080 },
      },
      source,
    );
    expect(env.port).toBe(8080);
  });

  it("parses value when optional variable is present", () => {
    const source = { PORT: "3000" };
    const env = loadEnv(
      {
        port: { key: "PORT", parse: asInt, optional: true, defaultValue: 8080 },
      },
      source,
    );
    expect(env.port).toBe(3000);
  });

  it("returns undefined default when optional has no defaultValue", () => {
    const source = {};
    const env = loadEnv(
      {
        optional: { key: "OPTIONAL", parse: asString, optional: true },
      },
      source,
    );
    expect(env.optional).toBeUndefined();
  });

  it("propagates parser errors", () => {
    const source = { PORT: "not-a-number" };
    expect(() =>
      loadEnv(
        {
          port: { key: "PORT", parse: asInt },
        },
        source,
      ),
    ).toThrow("Invalid integer: not-a-number");
  });

  it("maps schema keys to result keys", () => {
    const source = { MY_LONG_VAR_NAME: "value" };
    const env = loadEnv(
      {
        shortName: { key: "MY_LONG_VAR_NAME", parse: asString },
      },
      source,
    );
    expect(env.shortName).toBe("value");
    expect("MY_LONG_VAR_NAME" in env).toBe(false);
  });
});
