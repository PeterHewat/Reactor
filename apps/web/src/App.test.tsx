import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { initializeTranslations } from "./locales";

describe("App", () => {
  beforeEach(() => {
    // Initialize translations before each test
    initializeTranslations();
  });

  it("renders the heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /reactor/i })).toBeInTheDocument();
  });

  it("renders the GitHub link", () => {
    render(<App />);
    const link = screen.getByRole("link", { name: /github/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://github.com/PeterHewat/Reactor");
  });

  it("renders the theme toggle", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /theme/i })).toBeInTheDocument();
  });

  it("renders the language switcher", () => {
    render(<App />);
    expect(screen.getByRole("combobox", { name: /language/i })).toBeInTheDocument();
  });

  it("renders the features section", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /features/i })).toBeInTheDocument();
  });
});
