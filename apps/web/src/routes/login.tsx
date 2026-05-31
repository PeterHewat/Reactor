import { useTranslation } from "@repo/utils";
import { SignIn } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";
import { BackendSetup } from "../components/backend-setup";
import { isAuthEnabled } from "../lib/backend";

type LoginSearch = {
  redirect?: string;
};

/**
 * Clerk sign-in page (`/login`). URL uses "login"; copy uses i18n `auth.login`.
 */
function LoginPage() {
  const { t } = useTranslation();
  const { redirect: redirectTo } = Route.useSearch();

  if (!isAuthEnabled()) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center p-8">
        <BackendSetup />
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center p-8">
      <h1 className="sr-only">{t("auth.login")}</h1>
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/login"
        forceRedirectUrl={redirectTo ?? "/tasks"}
        fallbackRedirectUrl="/tasks"
      />
    </main>
  );
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: () => {
    if (!isAuthEnabled()) {
      return;
    }
  },
  component: LoginPage,
});
