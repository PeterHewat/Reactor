import { LanguageSwitcher, ThemeToggle } from "@repo/ui-web";
import { useTranslation } from "@repo/utils";

function App() {
  const { t } = useTranslation();

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-8">
      {/* Header with theme and language controls */}
      <header className="fixed top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher size="sm" />
        <ThemeToggle size="sm" />
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center text-center">
        <h1 className="mb-4 text-4xl font-bold">{t("home.title")}</h1>
        <p className="text-muted-foreground mb-8 text-lg">{t("home.subtitle")}</p>

        <a
          href="https://github.com/PeterHewat/Reactor"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 mb-12 text-lg underline underline-offset-4 transition-colors"
        >
          {t("home.viewOnGitHub")}
        </a>

        {/* Features section */}
        <section className="max-w-2xl">
          <h2 className="mb-6 text-2xl font-semibold">{t("home.features.title")}</h2>
          <ul className="text-muted-foreground grid gap-3 text-left sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              {t("home.features.react")}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              {t("home.features.convex")}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              {t("home.features.clerk")}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              {t("home.features.tailwind")}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              {t("home.features.i18n")}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              {t("home.features.themes")}
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default App;
