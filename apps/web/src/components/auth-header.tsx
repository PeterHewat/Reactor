import { useTranslation } from "@repo/utils";
import { useAuth, UserButton } from "@clerk/react";
import { Link } from "@tanstack/react-router";

/**
 * Auth controls for the header when Clerk is configured (must render inside ClerkProvider).
 */
export function AuthHeaderControls() {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <UserButton />;
  }

  return (
    <Link
      to="/login"
      className="text-primary hover:text-primary/80 text-sm font-medium underline-offset-4 hover:underline"
    >
      {t("auth.login")}
    </Link>
  );
}
