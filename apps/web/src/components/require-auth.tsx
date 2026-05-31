import { useTranslation } from "@repo/utils";
import { useConvexAuth } from "convex/react";
import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { isAuthEnabled } from "../lib/backend";
import { BackendSetup } from "./backend-setup";

/**
 * Redirects unauthenticated users to `/login` when Clerk + Convex are configured.
 *
 * @param props - Child content shown when authenticated
 * @returns Children, redirect, or setup instructions
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  if (!isAuthEnabled()) {
    return <BackendSetup />;
  }

  return <RequireAuthGate>{children}</RequireAuthGate>;
}

function RequireAuthGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <p className="text-muted-foreground mt-24 text-center" role="status">
        {t("common.loading")}
      </p>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: "/tasks" }} />;
  }

  return children;
}
