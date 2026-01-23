import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubmitButton } from "./submit-button";

// Mock useFormStatus from react-dom
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    useFormStatus: vi.fn(() => ({ pending: false })),
  };
});

// Import the mock to control it in tests
import { useFormStatus } from "react-dom";
const mockUseFormStatus = vi.mocked(useFormStatus);

// Helper to create mock FormStatus with correct types
const noopAction = () => {};
const createMockFormStatus = (pending: boolean) =>
  ({
    pending,
    data: pending ? new FormData() : null,
    method: pending ? ("post" as const) : null,
    action: pending ? noopAction : null,
  }) as ReturnType<typeof useFormStatus>;

describe("SubmitButton", () => {
  it("renders children when not pending", () => {
    mockUseFormStatus.mockReturnValue(createMockFormStatus(false));

    render(<SubmitButton>Submit</SubmitButton>);
    const btn = screen.getByRole("button", { name: "Submit" });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("shows pendingText and disables when form is pending", () => {
    mockUseFormStatus.mockReturnValue(createMockFormStatus(true));

    render(<SubmitButton pendingText="Submitting...">Submit</SubmitButton>);
    const btn = screen.getByRole("button", { name: "Submitting..." });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  it("shows children when pending but no pendingText provided", () => {
    mockUseFormStatus.mockReturnValue(createMockFormStatus(true));

    render(<SubmitButton>Submit</SubmitButton>);
    const btn = screen.getByRole("button", { name: "Submit" });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  it("has type submit", () => {
    mockUseFormStatus.mockReturnValue(createMockFormStatus(false));

    render(<SubmitButton>Submit</SubmitButton>);
    const btn = screen.getByRole("button", { name: "Submit" });
    expect(btn).toHaveAttribute("type", "submit");
  });

  it("passes through variant and size props", () => {
    mockUseFormStatus.mockReturnValue(createMockFormStatus(false));

    render(
      <SubmitButton variant="secondary" size="lg">
        Submit
      </SubmitButton>,
    );
    const btn = screen.getByRole("button", { name: "Submit" });
    expect(btn.className).toContain("bg-muted");
    expect(btn.className).toContain("h-12");
  });
});
