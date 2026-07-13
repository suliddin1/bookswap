# Iteration log

Use one entry per autonomous slice. Record facts, ownership, migrations, validation, evidence, and remaining failures. Do not use this log as a completion claim.

## 2026-07-14 — Autonomous preparation and audit

Goal: preserve the existing repository, establish durable guidance and a safe development backend, rerun the full read-only product/technical audit, and stop before broad implementation.

Ownership: repository preparation and documentation only. No application, migration, generated type, package, UI, or protected shared-contract file was edited after the checkpoint.

Completed:

- Confirmed D:\Codex Projects\2HandedBook as the only active repository and kept D:\GitHub\BookSwap out of scope.
- Inspected branch, status, remote, recent commits, tracked/untracked/ignored files, diff statistics, exclusions, staged secret patterns, and whitespace.
- Verified local environment/build/cache/test artifacts and credentials are ignored and no unsuitable files were tracked.
- Created autonomous/bookswap-product.
- Preserved 86 legitimate existing files in local commit d644ad2, chore: checkpoint existing BookSwap development state. No push.
- Researched official PangoBooks, Vinted UK, Tap.az, and Lalafo Azerbaijan experiences and documented adopt/adapt/reject decisions.
- Confirmed local Supabase CLI/Docker/Podman/Postgres tools were unavailable and did not restore or modify the inactive legacy project.
- Created the separate bookswap-development Supabase project in the sole authorized free-plan organization after zero cost was reported.
- Applied all four repository migrations in order.
- Verified schema, constraints, indexes, triggers, grants, RLS, Storage, Realtime, security-definer ACL/search_path, generated types, and advisors.
- Functionally verified Auth-to-profile creation with temporary data and removed it completely.
- Reran lint, TypeScript, unit, build, existing Playwright, and four-viewport runtime inspection.
- Created AGENTS.md and the nine docs/ai guidance/evidence files required for Goal mode.

Findings that changed priority:

- P0: public catalog is incompatible with safe users column grants and returns 500.
- P0: chat-room seller ownership policy compiles to a tautology.
- P0: favorite service-role query can disclose non-public listings.
- P0: redundant room broadcast lacks private-channel authorization.
- External verification blocker: no development service-role/secret key is available to the local app.

Validation: lint pass; TypeScript pass; 9/9 unit tests pass; build pass with 37 routes; 4/4 Playwright tests pass; four page viewports render without overflow, but /api/listings fails 500 at each viewport.

Next slice: resolve P0-001 and P0-002 through an additive migration/API contract with adversarial tests. Do not begin exchange/shelves feature work until P0 authorization and catalog failures are closed.

## Entry template

### YYYY-MM-DD — Slice title

- Goal / acceptance IDs:
- Files and contract owner:
- Starting branch/commit/status:
- Assumptions or approved decisions:
- Changes:
- Migrations and backend target:
- Security/authorization cases:
- Validation commands and exact results:
- Browser viewports/states and console/network result:
- Evidence updated:
- Commit:
- Remaining P0/P1:
- Ownership released / next safe slice:
