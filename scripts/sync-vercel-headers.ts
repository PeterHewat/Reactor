#!/usr/bin/env bun
/* eslint-disable no-console -- CLI output */
/**
 * Applies `packages/config/vercel-base-headers.json` to app `vercel.json` files.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const baseHeaders = JSON.parse(
  readFileSync(resolve(root, "packages/config/vercel-base-headers.json"), "utf8"),
) as Array<{ key: string; value: string }>;

const webCsp = {
  key: "Content-Security-Policy",
  value:
    "default-src 'self'; script-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.clerk.accounts.dev; frame-src 'self' https://*.clerk.accounts.dev; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

function patchVercel(rel: string, extraHeaders: Array<{ key: string; value: string }>): void {
  const path = resolve(root, rel);
  const config = JSON.parse(readFileSync(path, "utf8")) as {
    headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
  };

  const headers = [...baseHeaders, ...extraHeaders];
  config.headers = [{ source: "/(.*)", headers }];

  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`✓ Updated ${rel}`);
}

patchVercel("apps/marketing/vercel.json", []);
patchVercel("apps/web/vercel.json", [webCsp]);
