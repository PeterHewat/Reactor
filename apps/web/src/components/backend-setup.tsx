import { useTranslation } from "@repo/utils";
import { isAuthEnabled, isBackendEnabled } from "../lib/backend";

/**
 * Instructions when Convex/Clerk env vars are not configured.
 */
export function BackendSetup() {
  const { t } = useTranslation();

  if (isAuthEnabled()) {
    return null;
  }

  const needsConvex = !isBackendEnabled();

  return (
    <section className="border-border bg-muted/40 mx-auto mt-8 max-w-lg rounded-lg border p-6 text-left">
      <h2 className="mb-2 text-lg font-semibold">{t("backend.setupTitle")}</h2>
      <p className="text-muted-foreground mb-4 text-sm">{t("backend.setupBody")}</p>
      <ol className="text-muted-foreground list-decimal space-y-2 pl-5 text-sm">
        {needsConvex ? <li>{t("backend.stepConvex")}</li> : null}
        <li>{t("backend.stepClerk")}</li>
        <li>{t("backend.stepEnv")}</li>
      </ol>
      <p className="text-muted-foreground mt-4 text-sm">{t("backend.setupGuide")}</p>
    </section>
  );
}
