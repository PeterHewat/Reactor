# @repo/utils

Shared utilities for the Reactor monorepo.

## Installation

This package is internal to the monorepo. Import via the path alias:

```ts
import { cn, loadEnv, asString, asInt, asBoolean } from "@repo/utils";
```

## Utilities

### cn(...classes)

Merges class names, filtering out falsy values. Similar to `clsx` but lighter weight.

```ts
import { cn } from "@repo/utils";

// Basic usage
cn("foo", "bar"); // "foo bar"

// Conditional classes
cn("base", isActive && "active"); // "base active" or "base"

// Object syntax
cn("base", { active: isActive, disabled: isDisabled });

// Arrays
cn(["foo", "bar"], "baz"); // "foo bar baz"

// Deduplication
cn("foo", "foo", "bar"); // "foo bar"
```

### loadEnv(schema, source?)

Type-safe environment variable loader. Prevents logging secrets and validates required variables.

```ts
import { loadEnv, asString, asInt, asBoolean } from "@repo/utils";

const env = loadEnv({
  // Required variable
  DATABASE_URL: { key: "DATABASE_URL", parse: asString },

  // Optional with default
  PORT: { key: "PORT", parse: asInt, optional: true, defaultValue: 3000 },

  // Boolean parsing
  DEBUG: { key: "DEBUG", parse: asBoolean, optional: true, defaultValue: false },
});

// env.DATABASE_URL is string
// env.PORT is number (defaults to 3000)
// env.DEBUG is boolean (defaults to false)
```

#### Parsers

| Parser      | Input                             | Output                        |
| ----------- | --------------------------------- | ----------------------------- |
| `asString`  | Any string                        | `string`                      |
| `asInt`     | `"123"`                           | `123` (throws on invalid)     |
| `asBoolean` | `"true"`, `"1"`, `"false"`, `"0"` | `boolean` (throws on invalid) |

#### Schema Options

| Option         | Type        | Description                             |
| -------------- | ----------- | --------------------------------------- |
| `key`          | `string`    | Environment variable name               |
| `parse`        | `Parser<T>` | Parser function                         |
| `optional`     | `boolean`   | If true, won't throw when missing       |
| `defaultValue` | `T`         | Default value when optional and missing |

## Development

```bash
# Run tests
npm test -w packages/utils

# Type check
npm run typecheck -w packages/utils

# Build
npm run build -w packages/utils
```
