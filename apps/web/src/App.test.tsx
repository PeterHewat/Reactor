import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /reactor/i })).toBeInTheDocument();
  });

  it("renders the get started button", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
  });
});
