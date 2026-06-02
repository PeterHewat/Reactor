/**
 * Re-exports framework-agnostic env helpers from `@repo/env-core`.
 * Prefer `@repo/env-core/env` in new code that must not depend on `@repo/utils` peers.
 */
export { asBoolean, asInt, asString, loadEnv, type EnvVar } from "@repo/env-core/env";
