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
          "home.title": "Reactor",
          "home.subtitle": "React 19 + Convex + Clerk + Tailwind CSS",
          "home.viewRepository": "View repository on GitHub",
          "home.features.title": "Features",
          "home.features.react": "React 19",
          "nav.main": "Main",
          "nav.tasks": "Tasks",
          "backend.setupTitle": "Enable",
          "backend.setupBody": "Setup",
          "backend.stepConvex": "Convex",
          "backend.stepClerk": "Clerk",
          "backend.stepEnv": "Env",
          "backend.setupGuide": "Guide",
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

  it("renders the repository link when VITE_REPO_URL is set", async () => {
    vi.stubEnv("VITE_REPO_URL", "https://github.com/acme/my-app");
    render(<RouterProvider router={router} />);
    const link = await screen.findByRole("link", { name: /repository/i });
    expect(link).toHaveAttribute("href", "https://github.com/acme/my-app");
    vi.unstubAllEnvs();
  });
});
