# Iteration log

Use one entry per autonomous slice. Record facts, ownership, migrations, validation, evidence, and remaining failures. Do not use this log as a completion claim.

## 2026-07-14 — P0 public catalog and chat-room authorization

Goal / acceptance IDs: P0-001 and P0-002; CAT-01, PROF-01, BROW-01, CHAT-01, DB-01, SVC-01.

Ownership: root exclusively owned the database/security/API slice: the additive Supabase migrations, lib/database.types.ts verification, public listing/chat APIs, focused tests, and durable documentation. The delegated specialist was read-only. Ownership is released by this completed local checkpoint.

Starting state: branch autonomous/bookswap-product at e60b852 with a clean worktree. The development project is ACTIVE_HEALTHY with four migrations and zero security-advisor findings. Direct Data API evidence shows that selecting only users(id,name,city,created_at) succeeds while selecting email or all users columns is denied. Public embedded users relations still return 42501, and the deployed chat-room insert policy still compiles its intended seller ownership comparison to a tautology.

Implemented: added a non-exposed `private.user_is_active` security-definer predicate with an empty search path and restricted ACL; rebuilt every affected cross-table policy; qualified chat-room ownership checks; added a composite listing/seller foreign key and covering index; updated generated relationship types; made listing detail distinguish database faults from true 404s; and made room creation reject unavailable or banned sellers before insert. The safe four-column PostgREST seller embed remains atomic and no broad users grant was added.

Backend evidence: safe profiles and embedded sellers return 200 with exactly id/name/city/created_at; selecting email or `*` returns 401/42501; the private RPC returns 404; banning the fixture seller removes both profile and listing. Wrong seller, spoofed buyer, self-room, inactive listing, banned buyer/seller, nonexistent listing, anonymous insert, and third-party read all fail; the valid buyer/owner pair succeeds; privileged mismatches fail the composite foreign key. The policy catalog has zero tautologies/mismatched rooms, all nine public tables retain RLS, generated relationship types match, and the advisor-requested foreign-key index is present.

Validation: lint, TypeScript, 9/9 unit tests, production build, and 4/4 Playwright tests pass. Agent-browser production checks show catalog/detail API 200, safe seller rendering, no console/page errors, and no horizontal overflow at 1440x900, 1024x768, 390x844, or 360x800. Temporary Auth/profile/listing/chat fixtures were deleted and zero rows remain. Remaining limitations are the external development service secret, the Pro-only leaked-password advisor warning, a dev-only React Refresh CSP warning, and incomplete authenticated full-route/accessibility coverage.

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
