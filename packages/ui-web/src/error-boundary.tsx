import { cn } from "@repo/utils";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./button";

/**
 * Props for the ErrorBoundary component.
 */
export interface ErrorBoundaryProps {
  /** Child components to render when no error is present */
  children: ReactNode;
  /** Optional custom fallback UI to render when an error occurs */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Optional callback invoked when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional CSS class name for the default fallback container */
  className?: string;
  /**
   * When false, the default fallback hides `error.message` (production-safe).
   * Defaults to dev mode (`import.meta.env.DEV` in Vite, else non-production NODE_ENV).
   */
  showErrorDetails?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Whether the default fallback should expose raw error messages.
 *
 * @returns True in development builds
 */
function defaultShowErrorDetails(): boolean {
  if (typeof import.meta !== "undefined" && "env" in import.meta) {
    const meta = import.meta as ImportMeta & { env?: { DEV?: boolean; MODE?: string } };
    if (meta.env?.DEV !== undefined) return meta.env.DEV;
    if (meta.env?.MODE !== undefined) return meta.env.MODE !== "production";
  }
  return typeof process !== "undefined" && process.env.NODE_ENV !== "production";
}

/**
 * A React error boundary that catches rendering errors in its subtree
 * and displays a fallback UI instead of crashing the entire application.
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  /** Reset the error state so children re-render. */
  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const {
      children,
      fallback,
      className,
      showErrorDetails = defaultShowErrorDetails(),
    } = this.props;

    if (error) {
      if (typeof fallback === "function") {
        return fallback(error, this.reset);
      }

      if (fallback) {
        return fallback;
      }

      return (
        <div
          role="alert"
          className={cn(
            "flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center",
            className,
          )}
        >
          <h2 className="text-destructive text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            {showErrorDetails ? error.message : "An unexpected error occurred. Please try again."}
          </p>
          <Button variant="secondary" size="sm" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }

    return children;
  }
}
