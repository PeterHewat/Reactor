import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageSwitcher } from "./language-switcher";

// Mock the i18n store
vi.mock("@repo/utils", async () => {
  const actual = await vi.importActual("@repo/utils");
  return {
    ...actual,
    useI18nStore: vi.fn(),
    SUPPORTED_LOCALES: { en: "English", es: "Español" },
  };
});

import { useI18nStore } from "@repo/utils";
const mockUseI18nStore = vi.mocked(useI18nStore);

describe("LanguageSwitcher", () => {
  const mockSetLocale = vi.fn();

  beforeEach(() => {
    mockSetLocale.mockClear();
    mockUseI18nStore.mockReturnValue({
      locale: "en",
      setLocale: mockSetLocale,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders select with current locale", () => {
    render(<LanguageSwitcher />);
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("en");
  });

  it("renders all supported locales as options", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Español" })).toBeInTheDocument();
  });

  it("calls setLocale when selection changes", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.selectOptions(screen.getByRole("combobox"), "es");
    expect(mockSetLocale).toHaveBeenCalledWith("es");
  });

  it("shows locale codes when showFullName is false", () => {
    render(<LanguageSwitcher showFullName={false} />);
    expect(screen.getByRole("option", { name: "EN" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "ES" })).toBeInTheDocument();
  });

  it("uses custom locale labels", () => {
    render(<LanguageSwitcher localeLabels={{ en: "English (US)", es: "Spanish" }} />);
    expect(screen.getByRole("option", { name: "English (US)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Spanish" })).toBeInTheDocument();
  });

  it("applies size classes", () => {
    const { rerender } = render(<LanguageSwitcher size="sm" />);
    expect(screen.getByRole("combobox").className).toContain("h-8");

    rerender(<LanguageSwitcher size="lg" />);
    expect(screen.getByRole("combobox").className).toContain("h-12");
  });

  it("has accessible label", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-label", "Select language");
  });

  it("reflects current locale from store", () => {
    mockUseI18nStore.mockReturnValue({
      locale: "es",
      setLocale: mockSetLocale,
    });

    render(<LanguageSwitcher />);
    expect(screen.getByRole("combobox")).toHaveValue("es");
  });
});
