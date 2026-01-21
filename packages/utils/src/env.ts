type Parser<T> = (value: string) => T;

export type EnvVar<T> = {
  key: string;
  optional?: boolean;
  defaultValue?: T;
  parse: Parser<T>;
};

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

// Common parsers
export const asString: Parser<string> = (v) => v;
export const asInt: Parser<number> = (v) => {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new Error(`Invalid integer: ${v}`);
  return n;
};
export const asBoolean: Parser<boolean> = (v) => {
  const normalized = v.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  throw new Error(`Invalid boolean: ${v}`);
};
