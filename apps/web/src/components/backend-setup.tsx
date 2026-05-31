import { useTranslation } from "@repo/utils";
import { isAuthEnabled, isBackendEnabled } from "../lib/backend";
import { repoSetupGuideUrl } from "../lib/repo-url";

/**
 * Instructions when Convex/Clerk env vars are not configured.
 */
export function BackendSetup() {
  const { t } = useTranslation();

  if (isAuthEnabled()) {
    return null;
  }

  const needsConvex = !isBackendEnabled();
  const setupGuideUrl = repoSetupGuideUrl();

  return (
    <section className="border-border bg-muted/40 mx-auto mt-8 max-w-lg rounded-lg border p-6 text-left">
      <h2 className="mb-2 text-lg font-semibold">{t("backend.setupTitle")}</h2>
      <p className="text-muted-foreground mb-4 text-sm">{t("backend.setupBody")}</p>
      <ol className="text-muted-foreground list-decimal space-y-2 pl-5 text-sm">
        {needsConvex ? <li>{t("backend.stepConvex")}</li> : null}
        <li>{t("backend.stepClerk")}</li>
        <li>{t("backend.stepEnv")}</li>
      </ol>
      <p className="mt-4 text-sm">
        {setupGuideUrl ? (
          <a
            href={setupGuideUrl}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("backend.setupGuide")}
          </a>
        ) : (
          <span>{t("backend.setupGuideLocal")}</span>
        )}
      </p>
    </section>
  );
}
