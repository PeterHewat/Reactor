# Architecture Decision Records (ADR)

> This folder contains Architecture Decision Records - documents that capture important architectural decisions made during the project.

## What are ADRs?

Architecture Decision Records are short text documents that capture a decision, including:

- **Context**: What situation led to this decision?
- **Decision**: What did we decide?
- **Status**: Proposed, accepted, deprecated, superseded
- **Consequences**: What are the positive/negative outcomes?

## Template for New ADRs

Copy this template when creating new ADR files (name them `001-decision-title.md`, `002-next-decision.md`, etc.):

```markdown
# ADR-001: [Title of Decision]

## Status

[Proposed | Accepted | Deprecated | Superseded]

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing or have agreed to implement?

## Consequences

What becomes easier or more difficult to do and any risks introduced by this change?
```

## Example Decisions to Document

- Choice of React 19 over other frameworks
- Convex vs other backend solutions
- Tailwind CSS vs other styling approaches
- Monorepo structure decisions
- Testing strategy choices
- Deployment platform selection
- Third-party service integrations

## Index of ADRs

- [ADR-001: Convex as the Backend over tRPC/Supabase](001-convex-over-trpc-supabase.md) - Accepted - 2026-03-16
