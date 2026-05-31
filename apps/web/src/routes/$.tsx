import { useTranslation } from "@repo/utils";
import { Link, createFileRoute } from "@tanstack/react-router";

/**
 * Catch-all 404 page.
 */
function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-2 text-3xl font-bold">{t("errors.notFound")}</h1>
      <p className="text-muted-foreground mb-6 text-sm">{t("errors.notFoundHint")}</p>
      <Link to="/" className="text-primary hover:underline">
        {t("backend.backHome")}
      </Link>
    </main>
  );
}

export const Route = createFileRoute("/$")({
  component: NotFoundPage,
});
