# @repo/ui

Shared UI components for the Reactor monorepo. Built with React 19 and Tailwind CSS.

## Installation

This package is internal to the monorepo. Import via the path alias:

```tsx
import { Button } from "@repo/ui";
```

## Components

### Button

A flexible button component with variants and sizes.

```tsx
import { Button } from "@repo/ui";

// Variants: primary (default), secondary, ghost
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>

// Sizes: sm, md (default), lg
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Loading state
<Button isLoading>Loading...</Button>

// With custom className
<Button className="w-full">Full Width</Button>
```

#### Props

| Prop        | Type                                  | Default     | Description                             |
| ----------- | ------------------------------------- | ----------- | --------------------------------------- |
| `variant`   | `"primary" \| "secondary" \| "ghost"` | `"primary"` | Visual style variant                    |
| `size`      | `"sm" \| "md" \| "lg"`                | `"md"`      | Button size                             |
| `isLoading` | `boolean`                             | `false`     | Shows loading state and disables button |
| `disabled`  | `boolean`                             | `false`     | Disables the button                     |
| `className` | `string`                              | -           | Additional CSS classes                  |

Plus all standard `<button>` HTML attributes.

## Development

```bash
# Run tests
npm test -w packages/ui

# Type check
npm run typecheck -w packages/ui

# Build
npm run build -w packages/ui
```

## Dependencies

- `@repo/utils` - For the `cn()` class merging utility
- `react` (peer) - React 19+
