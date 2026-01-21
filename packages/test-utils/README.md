# @repo/test-utils

Shared test utilities for the Reactor monorepo.

## Installation

This package is automatically available to all workspace packages.

## Usage

### Match Media Mock

The `setupMatchMedia` function provides a mock for `window.matchMedia`, which is required for testing components that use theme detection or other media query features.

```typescript
// In your setupTests.ts
import { setupMatchMedia } from "@repo/test-utils";

// Setup with default (light mode)
setupMatchMedia();

// Or setup with dark mode preference
setupMatchMedia(true);
```

For more granular control in individual tests:

```typescript
import { mockMatchMedia } from "@repo/test-utils";

test("handles dark mode", () => {
  window.matchMedia = mockMatchMedia(true); // Dark mode
  // ... your test
});
```

## Available Utilities

### Mocks

- `setupMatchMedia(defaultMatches?)` - Setup `window.matchMedia` mock globally
- `mockMatchMedia(defaultMatches?)` - Create a mock `matchMedia` function for individual tests

## Adding New Utilities

When adding shared test utilities:

1. Create the utility in `src/mocks/` or appropriate subdirectory
2. Export from `src/index.ts`
3. Add documentation to this README
