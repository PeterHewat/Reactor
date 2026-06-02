import { AuthenticateWithRedirectCallback } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";

/**
 * OAuth redirect target for Clerk `<SignIn routing="path" path="/login" />`.
 */
function LoginSsoCallbackPage() {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center p-8">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/tasks"
        signUpFallbackRedirectUrl="/tasks"
      />
    </main>
  );
}

export const Route = createFileRoute("/login/sso-callback")({
  component: LoginSsoCallbackPage,
});
