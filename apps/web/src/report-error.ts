import type { ErrorInfo } from "react";

/**
 * Reports a caught React error to an observability backend.
 * Default is a no-op in production; wire Sentry (or similar) when ready.
 *
 * @param error - The thrown error
 * @param errorInfo - React component stack metadata
 *
 * @example
 * // apps/web/src/main.tsx
 * <ErrorBoundary onError={reportError}>
 *   <App />
 * </ErrorBoundary>
 *
 * @example
 * // After adding Sentry:
 * // import * as Sentry from "@sentry/react";
 * // Sentry.captureException(error, { extra: { componentStack: errorInfo?.componentStack } });
 */
export function reportError(error: Error, errorInfo?: ErrorInfo): void {
  void error;
  void errorInfo;
}
