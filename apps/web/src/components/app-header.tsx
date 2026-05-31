import { LanguageSwitcher, ThemeToggle } from "@repo/ui-web";
import { useTranslation } from "@repo/utils";
import { Link } from "@tanstack/react-router";
import { isAuthEnabled, isBackendEnabled } from "../lib/backend";
import { AuthHeaderControls } from "./auth-header";

/**
 * Global header: nav, theme, language, and auth controls.
 */
export function AppHeader() {
  const { t } = useTranslation();
  const showTasksNav = isBackendEnabled();
  const authEnabled = isAuthEnabled();

  return (
    <header className="border-border bg-background/80 fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b px-4 py-3 backdrop-blur-sm">
      <nav className="flex items-center gap-4" aria-label={t("nav.main")}>
        <Link to="/" className="text-foreground hover:text-primary font-semibold transition-colors">
          {t("home.title")}
        </Link>
        {showTasksNav ? (
          <Link
            to="/tasks"
            className="text-muted-foreground hover:text-primary text-sm transition-colors"
          >
            {t("nav.tasks")}
          </Link>
        ) : null}
      </nav>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        {authEnabled ? <AuthHeaderControls /> : null}
      </div>
    </header>
  );
}
