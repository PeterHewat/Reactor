import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

// Mock @repo/utils to avoid useSyncExternalStore dispatcher issues in tests
vi.mock("@repo/utils", async () => {
  const actual = await vi.importActual("@repo/utils");
  return {
    ...actual,
    useTranslation: vi.fn(),
  };
});

import { useTranslation } from "@repo/utils";
const mockUseTranslation = vi.mocked(useTranslation);

describe("App", () => {
  beforeEach(() => {
    // Mock translation function with English translations
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          "home.title": "Reactor",
          "home.subtitle": "A modern React monorepo starter",
          "home.viewOnGitHub": "View on GitHub",
          "home.features": "Features",
        };
        return translations[key] || key;
      },
      locale: "en",
      setLocale: vi.fn(),
    });
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
