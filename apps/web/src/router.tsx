import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Application router instance (TanStack Router file routes).
 */
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
