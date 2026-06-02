import { vi } from "vitest";

/**
 * Registers Vitest mocks for `convex/react` (no real Convex deployment in unit tests).
 * Import this module first in `setupTests.ts` for apps that use Convex hooks.
 *
 * @example
 * // apps/web/setupTests.ts
 * import "@repo/test-utils/convex-react-setup";
 */
vi.mock("convex/react", () => ({
  ConvexProvider: ({ children }: { children: unknown }) => children,
  useConvexAuth: () => ({
    isLoading: false,
    isAuthenticated: false,
  }),
  useQuery: () => undefined,
  useMutation: () => {
    const fn = async () => undefined;
    return fn;
  },
}));
