# ADR-001: Convex as the Backend over tRPC/Supabase

## Status

Accepted

## Context

This project targets a multi-platform product (web, mobile, marketing) that requires:

- Real-time data synchronization across clients
- A type-safe API layer shared between frontend and backend
- Authentication integration (Clerk)
- Minimal infrastructure management for a small team or solo developer
- A backend that works well in a Bun/TypeScript monorepo

Three candidates were evaluated:

| Concern                 | Convex                          | tRPC                                       | Supabase                              |
| ----------------------- | ------------------------------- | ------------------------------------------ | ------------------------------------- |
| Real-time sync          | ✅ Built-in reactive queries    | ❌ Requires separate WebSocket layer       | ✅ Realtime via Postgres CDC          |
| Type safety             | ✅ End-to-end, schema-derived   | ✅ End-to-end via TypeScript               | ⚠️ Generated types, can drift         |
| Infrastructure          | ✅ Fully managed                | ❌ Needs a server (Express, Next.js, etc.) | ✅ Fully managed                      |
| Auth integration        | ✅ First-class Clerk support    | ⚠️ Manual JWT validation                   | ✅ Built-in (own auth or third-party) |
| Offline / optimistic UI | ✅ Built-in optimistic updates  | ❌ Manual                                  | ⚠️ Manual                             |
| Vendor lock-in          | ⚠️ Convex-specific query model  | ✅ Portable (any HTTP server)              | ⚠️ Supabase-specific APIs             |
| Local dev experience    | ✅ `convex dev` with hot reload | ✅ Runs anywhere                           | ✅ Local Docker stack                 |
| React Native support    | ✅ Official SDK                 | ✅ Works anywhere                          | ✅ Works anywhere                     |

### Why not tRPC?

tRPC is an excellent choice for teams that already have a Node.js server (e.g., Next.js API routes, Express). However, it requires you to own and operate the server layer. For this starter, the goal is to minimize infrastructure concerns and maximize developer velocity. tRPC also has no built-in real-time story — you would need to add WebSockets (e.g., via Pusher, Ably, or a custom socket server), which adds significant complexity.

### Why not Supabase?

Supabase is a strong option, especially for teams familiar with PostgreSQL. The trade-offs that pushed us toward Convex:

- **Real-time model**: Supabase Realtime is based on Postgres CDC (change data capture), which is powerful but requires careful table/row-level security configuration. Convex's reactive query model is simpler to reason about for most application patterns.
- **Type safety**: Supabase generates types from the database schema, but they can drift if migrations are not run. Convex's schema is defined in TypeScript and is always in sync.
- **Optimistic updates**: Convex provides built-in optimistic update helpers. Supabase requires manual implementation.
- **Clerk integration**: Convex has a first-class `ConvexProviderWithClerk` integration. Supabase uses its own auth system; integrating Clerk requires custom JWT configuration.

## Decision

Use **Convex** as the backend for database, API functions, and real-time subscriptions. Pair it with **Clerk** for authentication using the official `convex/react-clerk` integration.

The Convex schema is defined in [`convex/schema.ts`](../../convex/schema.ts) and functions in [`convex/tasks.ts`](../../convex/tasks.ts) serve as the example pattern for all backend logic.

## Consequences

**Positive:**

- Zero infrastructure to manage — Convex handles hosting, scaling, and database
- Real-time reactivity is free; `useQuery` automatically re-renders on data changes
- Full end-to-end type safety from schema definition to React component
- Optimistic updates are built-in, reducing boilerplate for responsive UIs
- Clerk integration is a single provider swap in [`apps/web/src/main.tsx`](../../apps/web/src/main.tsx)

**Negative / Risks:**

- **Vendor lock-in**: Business logic in Convex functions is not portable to another backend without a rewrite. Mitigated by keeping domain logic in `packages/utils` where possible.
- **Convex query model**: Convex uses a document-oriented model with indexes rather than arbitrary SQL. Complex relational queries require careful index design.
- **Cost at scale**: Convex pricing is consumption-based. High-frequency real-time apps should monitor function call volume.
- **Ecosystem maturity**: Convex is newer than Supabase or a self-hosted Postgres stack. The community and third-party integrations are smaller, though growing rapidly.
