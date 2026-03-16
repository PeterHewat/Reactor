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
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * A React error boundary that catches rendering errors in its subtree
 * and displays a fallback UI instead of crashing the entire application.
 *
 * Supports both a static fallback element and a render-prop fallback
 * that receives the error and a reset function.
 *
 * @example
 * // Default fallback
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * @example
 * // Custom fallback with render prop
 * <ErrorBoundary fallback={(error, reset) => (
 *   <div>
 *     <p>Something broke: {error.message}</p>
 *     <button onClick={reset}>Try again</button>
 *   </div>
 * )}>
 *   <App />
 * </ErrorBoundary>
 *
 * @example
 * // With error reporting
 * <ErrorBoundary onError={(error, info) => reportToService(error, info)}>
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
    const { children, fallback, className } = this.props;

    if (error) {
      if (typeof fallback === "function") {
        return fallback(error, this.reset);
      }

      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div
          role="alert"
          className={cn(
            "flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center",
            className,
          )}
        >
          <h2 className="text-destructive text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md text-sm">{error.message}</p>
          <Button variant="secondary" size="sm" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }

    return children;
  }
}
