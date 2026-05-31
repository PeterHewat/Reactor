import { useTranslation } from "@repo/utils";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BackendSetup } from "../components/backend-setup";
import { isAuthEnabled } from "../lib/backend";
import { getRepoUrl } from "../lib/repo-url";

/**
 * Home page: feature overview and setup prompts until Convex + Clerk are wired.
 */
export function HomePage() {
  const { t } = useTranslation();
  const repoUrl = getRepoUrl();

  const featureKeys = [
    "home.features.react",
    "home.features.convex",
    "home.features.clerk",
    "home.features.tailwind",
    "home.features.i18n",
    "home.features.themes",
  ] as const;

  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center text-center">
        <h1 className="mb-4 text-4xl font-bold">{t("home.title")}</h1>
        <p className="text-muted-foreground mb-8 text-lg">{t("home.subtitle")}</p>

        <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
          {repoUrl ? (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 text-lg underline underline-offset-4 transition-colors"
            >
              {t("home.viewRepository")}
            </a>
          ) : null}
          {isAuthEnabled() ? (
            <Link
              to="/tasks"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              {t("nav.tasks")}
            </Link>
          ) : null}
        </div>

        {!isAuthEnabled() ? <BackendSetup /> : null}

        <section className="max-w-2xl">
          <h2 className="mb-6 text-2xl font-semibold">{t("home.features.title")}</h2>
          <ul className="text-muted-foreground grid gap-3 text-left sm:grid-cols-2">
            {featureKeys.map((key) => (
              <li key={key} className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                {t(key)}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
