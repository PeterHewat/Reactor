import { ErrorBoundary } from "@repo/ui-web";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AppHeader } from "../components/app-header";
import { reportError } from "../report-error";

const RouterDevtools = lazy(() =>
  import("@tanstack/react-router-devtools").then((m) => ({
    default: m.TanStackRouterDevtools,
  })),
);

/**
 * Root layout: global header, error boundary, and child routes.
 */
function RootLayout() {
  return (
    <ErrorBoundary onError={reportError}>
      <AppHeader />
      <div className="pt-20">
        <Outlet />
      </div>
      {import.meta.env.DEV ? (
        <Suspense fallback={null}>
          <RouterDevtools />
        </Suspense>
      ) : null}
    </ErrorBoundary>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
