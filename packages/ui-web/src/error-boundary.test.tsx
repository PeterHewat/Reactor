import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./error-boundary";

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
}

/** Module-level flag so the component can be controlled from tests. */
let toggleThrowFlag = true;

function ToggleThrowComponent() {
  if (toggleThrowFlag) throw new Error("Boom");
  return <div>Recovered</div>;
}

describe("ErrorBoundary", () => {
  // Suppress React error boundary console.error noise in tests
  // eslint-disable-next-line no-console
  const originalError = console.error;
  beforeEach(() => {
    // eslint-disable-next-line no-console
    console.error = vi.fn();
  });
  afterEach(() => {
    // eslint-disable-next-line no-console
    console.error = originalError;
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders default fallback when an error occurs", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("renders custom static fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });

  it("renders render-prop fallback with error and reset", () => {
    render(
      <ErrorBoundary
        fallback={(error, reset) => (
          <div>
            <p>Error: {error.message}</p>
            <button onClick={reset}>Reset</button>
          </div>
        )}
      >
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Error: Test error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("calls onError callback when an error occurs", () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Test error" }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it("resets error state when Try again is clicked", async () => {
    const user = userEvent.setup();

    toggleThrowFlag = true;

    const { rerender } = render(
      <ErrorBoundary>
        <ToggleThrowComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Stop throwing before clicking reset
    toggleThrowFlag = false;

    await user.click(screen.getByRole("button", { name: /try again/i }));

    // After reset, the component should re-render without error
    rerender(
      <ErrorBoundary>
        <ToggleThrowComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Recovered")).toBeInTheDocument();
  });
});
