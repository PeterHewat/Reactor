# Product specifications

Implementation-ready specs: the acceptance criteria, UI surfaces, routes/APIs, and edge cases an agent or contributor needs to build a feature correctly. Specs are derived from the human-oriented docs (e.g. `product.md`, `architecture.md`) and are the source of truth for **what to build**; AGENTS.md remains the source of truth for **how to build it**.

> **Template note:** This folder ships empty on purpose. Add a `feature-matrix.md` and versioned `vN/` folders as your product takes shape — see the conventions below. Delete this note once you have real specs.

## Structure

| Path                  | Purpose                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| `feature-matrix.md`   | One row per capability, across all release phases (ID, feature, phase, actor, route/API, spec link, status) |
| `v0/`, `v1/`, … `vN/` | Per-phase detail: acceptance criteria, UI, API shapes, permissions, and edge cases                          |

Create a new `vN/` folder only when that phase is scheduled — keep earlier phases as matrix rows plus a summary in the human-oriented docs until then.

## Conventions

- **Feature matrix** is the index. Each row gets a stable ID (`F-01`, `F-02`, …), an actor, a route or API surface, a link to its detailed spec, and a **Status** (`Planned` → `In progress` → `Shipped`). Update the Status column when code ships.
- **Phase folder** (`vN/`) starts with a `README.md` (goal, epic index, definition of done, open decisions) and one file per epic. Keep epics small and implementable in order.
- **Cross-cutting** concerns shared by every epic in a phase (data model, permissions, lifecycles) go in `vN/cross-cutting.md` so individual epic files stay focused.
- Specs describe **intended** behaviour. When code disagrees with a spec, fix one of them — never let them silently diverge.

## How to use

1. Pick the release phase (start with `v0`).
2. Read `vN/cross-cutting.md` for the shared data model, permissions, and lifecycles.
3. Implement one epic file at a time, in the order given by `vN/README.md`.
4. Update the feature-matrix **Status** as each capability ships.

## Related

- `../product.md` — vision, phases, metrics (overview)
- `../architecture.md` — domains and design decisions
- `../platforms.md` — monorepo routes and packages
- `../adr/` — recorded architectural decisions
