/**
 * A function that parses a string value into a typed value.
 */
type Parser<T> = (value: string) => T;

/**
 * Configuration for a single environment variable.
 */
export type EnvVar<T> = {
  /** The environment variable name (e.g., "DATABASE_URL") */
  key: string;
  /** If true, won't throw when the variable is missing */
  optional?: boolean;
  /** Default value when optional and missing */
  defaultValue?: T;
  /** Parser function to convert string to typed value */
  parse: Parser<T>;
};

/**
 * Loads and validates environment variables according to a schema.
 * Prevents accidental logging of secrets by returning typed values.
 *
 * @param schema - Object mapping names to EnvVar configurations
 * @param source - Environment source (defaults to process.env)
 * @returns Typed object with parsed environment values
 * @throws Error if a required variable is missing or parsing fails
 *
 * @example
 * const env = loadEnv({
 *   DATABASE_URL: { key: "DATABASE_URL", parse: asString },
 *   PORT: { key: "PORT", parse: asInt, optional: true, defaultValue: 3000 },
 * });
 */
export function loadEnv<TSchema extends Record<string, EnvVar<unknown>>>(
  schema: TSchema,
  source: Record<string, string | undefined> = process.env,
): { [K in keyof TSchema]: TSchema[K] extends EnvVar<infer T> ? T : never } {
  const result: Record<string, unknown> = {};
  for (const [name, spec] of Object.entries(schema)) {
    const raw = source[spec.key];
    if (raw == null || raw === "") {
      if (spec.optional) {
        result[name] = spec.defaultValue as unknown;
        continue;
      }
      throw new Error(`Missing required environment variable: ${spec.key}`);
    }
    result[name] = spec.parse(raw);
  }
  return result as { [K in keyof TSchema]: TSchema[K] extends EnvVar<infer T> ? T : never };
}

/**
 * Parser that returns the string value as-is.
 */
export const asString: Parser<string> = (v) => v;

/**
 * Parser that converts a string to an integer.
 * @throws Error if the value is not a valid integer
 */
export const asInt: Parser<number> = (v) => {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new Error(`Invalid integer: ${v}`);
  return n;
};

/**
 * Parser that converts a string to a boolean.
 * Accepts: "true", "1" (true) or "false", "0" (false)
 * @throws Error if the value is not a valid boolean string
 */
export const asBoolean: Parser<boolean> = (v) => {
  const normalized = v.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  throw new Error(`Invalid boolean: ${v}`);
};
