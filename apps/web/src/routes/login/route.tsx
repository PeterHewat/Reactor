import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Layout for `/login` and `/login/sso-callback` (Clerk path routing). */
export const Route = createFileRoute("/login")({
  component: () => <Outlet />,
});
