import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";

// Mock the theme store
vi.mock("@repo/utils", async () => {
  const actual = await vi.importActual("@repo/utils");
  return {
    ...actual,
    useThemeStore: vi.fn(),
  };
});

import { useThemeStore } from "@repo/utils";
const mockUseThemeStore = vi.mocked(useThemeStore);

describe("ThemeToggle", () => {
  const mockSetMode = vi.fn();

  beforeEach(() => {
    mockSetMode.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with light mode icon", () => {
    mockUseThemeStore.mockReturnValue({
      mode: "light",
      resolvedTheme: "light",
      setMode: mockSetMode,
      updateResolvedTheme: vi.fn(),
    });

    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", expect.stringContaining("Light"));
  });

  it("renders with dark mode icon", () => {
    mockUseThemeStore.mockReturnValue({
      mode: "dark",
      resolvedTheme: "dark",
      setMode: mockSetMode,
      updateResolvedTheme: vi.fn(),
    });

    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", expect.stringContaining("Dark"));
  });

  it("renders with system mode icon", () => {
    mockUseThemeStore.mockReturnValue({
      mode: "system",
      resolvedTheme: "light",
      setMode: mockSetMode,
      updateResolvedTheme: vi.fn(),
    });

    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", expect.stringContaining("System"));
  });

  it("cycles from light to dark on click", async () => {
    const user = userEvent.setup();
    mockUseThemeStore.mockReturnValue({
      mode: "light",
      resolvedTheme: "light",
      setMode: mockSetMode,
      updateResolvedTheme: vi.fn(),
    });

    render(<ThemeToggle />);
    await user.click(screen.getByRole("button"));
    expect(mockSetMode).toHaveBeenCalledWith("dark");
  });

  it("cycles from dark to system on click", async () => {
    const user = userEvent.setup();
    mockUseThemeStore.mockReturnValue({
      mode: "dark",
      resolvedTheme: "dark",
      setMode: mockSetMode,
      updateResolvedTheme: vi.fn(),
    });

    render(<ThemeToggle />);
    await user.click(screen.getByRole("button"));
    expect(mockSetMode).toHaveBeenCalledWith("system");
  });

  it("cycles from system to light on click", async () => {
    const user = userEvent.setup();
    mockUseThemeStore.mockReturnValue({
      mode: "system",
      resolvedTheme: "light",
      setMode: mockSetMode,
      updateResolvedTheme: vi.fn(),
    });

    render(<ThemeToggle />);
    await user.click(screen.getByRole("button"));
    expect(mockSetMode).toHaveBeenCalledWith("light");
  });

  it("shows label when showLabel is true", () => {
    mockUseThemeStore.mockReturnValue({
      mode: "light",
      resolvedTheme: "light",
      setMode: mockSetMode,
      updateResolvedTheme: vi.fn(),
    });

    render(<ThemeToggle showLabel />);
    expect(screen.getByText("Light")).toBeInTheDocument();
  });

  it("uses custom labels", () => {
    mockUseThemeStore.mockReturnValue({
      mode: "light",
      resolvedTheme: "light",
      setMode: mockSetMode,
      updateResolvedTheme: vi.fn(),
    });

    render(<ThemeToggle showLabel labels={{ light: "Claro" }} />);
    expect(screen.getByText("Claro")).toBeInTheDocument();
  });

  it("applies size classes", () => {
    mockUseThemeStore.mockReturnValue({
      mode: "light",
      resolvedTheme: "light",
      setMode: mockSetMode,
      updateResolvedTheme: vi.fn(),
    });

    const { rerender } = render(<ThemeToggle size="sm" />);
    expect(screen.getByRole("button").className).toContain("h-8");

    rerender(<ThemeToggle size="lg" />);
    expect(screen.getByRole("button").className).toContain("h-12");
  });
});
