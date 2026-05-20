# Security headers and CSP

Examples for the web app (Vite) and static marketing site. Adjust directives for your third-party scripts (Clerk, analytics, etc.).

## Content-Security-Policy (baseline)

Start strict and loosen only what you need:

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self' https://*.convex.cloud wss://*.convex.cloud;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

With **Clerk**, add Clerk hosts to `script-src`, `connect-src`, and `frame-src` per [Clerk CSP docs](https://clerk.com/docs/security/clerk-csp).

With **Vite dev**, do not apply production CSP in local dev unless you maintain a separate dev policy (HMR needs relaxed `script-src`).

## Vite (web app)

Vite does not set security headers in dev. For production preview or a custom server, use `server.headers` in `apps/web/vite.config.ts`:

```ts
export default defineConfig({
  server: {
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    },
  },
  preview: {
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  },
});
```

For full CSP on static hosting, configure the host (below) — not only Vite.

## Vercel

Committed in this template:

- `apps/web/vercel.json` — monorepo build, SPA rewrites, baseline CSP (Clerk + Convex hosts)
- `apps/marketing/vercel.json` — monorepo Astro build, security headers

Create two Vercel projects (root directories `apps/web` and `apps/marketing`). CD uses `VERCEL_WEB_PROJECT_ID` and `VERCEL_MARKETING_PROJECT_ID` on `web-v*` / `marketing-v*` releases.

## Netlify

`apps/web/public/_headers` (copied to `dist/` on build):

```text
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.convex.cloud wss://*.convex.cloud; frame-ancestors 'none'
```

## Cloudflare Pages

Cloudflare Dashboard → Rules → Transform Rules → Modify response header, or `_headers` file in the publish directory (same format as Netlify).

Enable **HSTS** at the zone level when you have a stable HTTPS domain.

## Marketing (Astro static)

Same host-level header files under `apps/marketing/public/_headers` or provider config. Astro output is static HTML — headers are always set by the CDN/host, not Astro itself.

## Checklist

- [ ] CSP allows Convex (`connect-src` / `wss:` for your deployment URL)
- [ ] Clerk domains added if auth is enabled
- [ ] No secrets in client bundles; use env vars via `loadEnv` / `requireWebEnv`
- [ ] Test production build with browser DevTools → Network → document response headers
