import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders children and applies variant + size classes", () => {
    render(
      <Button variant="primary" size="md">
        Hello
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Hello" });
    expect(btn).toBeInTheDocument();
    // Rough checks for token-based classes
    expect(btn.className).toContain("bg-primary");
    expect(btn.className).toContain("h-10");
  });

  it("merges custom className via cn()", () => {
    render(<Button className="custom" />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("custom");
  });

  it("disables when isLoading", () => {
    render(<Button isLoading>Loading</Button>);
    const btn = screen.getByRole("button", { name: "Loading" });
    expect(btn).toBeDisabled();
  });
});
