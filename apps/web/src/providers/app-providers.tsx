import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { isAuthEnabled, isBackendEnabled } from "../lib/backend";
import { loadWebEnv } from "../env";

/**
 * Root providers: Clerk + Convex when configured, otherwise passthrough.
 *
 * @param props - Child tree
 * @returns Provider-wrapped children or fragment
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const backend = isBackendEnabled();
  const auth = isAuthEnabled();

  const convex = useMemo(() => {
    if (!backend) return null;
    const { convexUrl } = loadWebEnv();
    if (!convexUrl) return null;
    return new ConvexReactClient(convexUrl);
  }, [backend]);

  if (!backend || !convex) {
    return children;
  }

  if (auth) {
    const { clerkPublishableKey } = loadWebEnv();
    if (!clerkPublishableKey) {
      return children;
    }

    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          {children}
        </ConvexProviderWithClerk>
      </ClerkProvider>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
