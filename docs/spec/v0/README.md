# Phase v0 — Starter vertical slice

## Goal

Prove Convex + Clerk + React file routes with a minimal tasks demo agents can extend.

Read [cross-cutting.md](./cross-cutting.md) first (auth, env, data model).

## Definition of done

- [x] `/tasks` CRUD with auth and ownership checks
- [x] `/login` with Clerk (URL uses `login`; copy is i18n-driven)
- [x] Degraded mode without env (home + setup instructions)
- [x] Vitest + Playwright coverage for shell UI

## Epics

1. [tasks.md](./tasks.md) — sample tasks capability
