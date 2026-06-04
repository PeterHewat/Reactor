import { PRODUCT_NAME } from "@repo/config/product";
import { render, screen } from "@testing-library/react";
import { RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { router } from "./router";

vi.mock("@repo/utils", async () => {
  const actual = await vi.importActual("@repo/utils");
  return {
    ...actual,
    useTranslation: vi.fn(),
  };
});

vi.mock("./lib/backend", () => ({
  isAuthEnabled: vi.fn(() => false),
  isBackendEnabled: vi.fn(() => false),
}));

import { useTranslation } from "@repo/utils";

const mockUseTranslation = vi.mocked(useTranslation);

describe("HomePage", () => {
  beforeEach(async () => {
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          "home.title": PRODUCT_NAME,
          "home.subtitle": "React 19 + Convex + Clerk + Tailwind CSS",
          "home.features.title": "Features",
          "home.features.react": "React 19",
          "nav.main": "Main",
          "nav.tasks": "Tasks",
          "backend.setupTitle": "Enable",
          "backend.setupBody": "Setup",
          "backend.stepConvex": "Convex",
          "backend.stepClerk": "Clerk",
          "backend.stepEnv": "Env",
          "backend.setupGuide": "See docs/getting-started.md",
          "backend.backHome": "Home",
        };
        return translations[key] ?? key;
      },
      locale: "en",
      setLocale: vi.fn(),
    });
    await router.navigate({ to: "/" });
  });

  it("renders the heading", async () => {
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("heading", { name: /reactor/i })).toBeInTheDocument();
  });
});
