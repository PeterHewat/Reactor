# Architecture

> Document your business logic architecture and system design here.

## Purpose

This document should capture the high-level design decisions that drive your application's business logic and user experience. Focus on the "why" behind your architecture, not the technical implementation details.

## What to Document

### Business Architecture

- Core business domains and how they relate
- Key business rules and constraints
- User workflows and business processes
- Data ownership and lifecycle

### System Boundaries

- What your application is responsible for
- External services and integrations
- API boundaries and contracts
- Data flow between business domains

### Key Design Decisions

- Why you chose certain patterns
- Trade-offs you made and why
- Constraints that influenced your design
- Assumptions about scale and growth

## Examples of Good Architecture Documentation

### Business Domains

```
User Management → Authentication, profiles, preferences
Content System → Creation, editing, publishing workflow
Notification Engine → Real-time alerts, email campaigns
```

### Key Architectural Decisions

- **Decision**: Event-driven architecture for notifications
- **Rationale**: Decouples notification logic from core business operations
- **Trade-off**: Added complexity for better scalability

## What NOT to Document Here

- Technology choices (React, Convex, etc.) - these are implementation details
- Code patterns or API documentation - the code itself should be clear
- Configuration examples - these belong in setup documentation
- Deployment architecture - infrastructure concerns are separate

## Keep it Business-Focused

Your architecture should be understandable by non-technical stakeholders. Focus on business capabilities, user journeys, and domain logic rather than technical implementation details.
