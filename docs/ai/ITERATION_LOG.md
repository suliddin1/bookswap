# Iteration log

## 2026-07-14 — P1 catalog pagination and seller inventory

Goal / acceptance IDs: P1-003, P1-004; PROF-02, PAGE-01, PERF-01, FILTER-01, A11Y-01, TEST-01.

Ownership: root exclusively owns the stable listing cursor contract, public catalog GET/hook/UI, public seller API/page/component, seller navigation links, additive pagination indexes, focused tests, and durable documentation. No other agent is editing these files.

Starting state: clean branch `autonomous/bookswap-product` at `a2a78ab`. Catalog GET limits to 24/50 with no cursor or next-page metadata. Newest uses `(created_at,id)`, but price sort ties only on `id` without a matching index. The client applies condition and maximum-price after the fixed server page, making later eligible copies unreachable and the displayed count incomplete. No public seller route exists; seller names are plain text. Catalog search/location/condition controls also retain the previously recorded empty accessible-name gap.

Planned contract: versioned base64url cursor bound to normalized filters/seller scope and validated sort tuple; deterministic keyset predicates for newest and both price directions; `limit + 1` next-page detection; server-side condition/price filters; deduplicating load-more clients; safe active/sold seller inventory plus eligible sold-interaction rating context; exact safe profile fields; supporting partial indexes; equal-sort/concurrent-insert/direct API/browser/accessibility evidence.

Implemented: catalog and seller APIs now return `{items,nextCursor}` pages using filter-bound, versioned cursors and deterministic `(created_at,id)` or `(price,id)` tuples. Condition and maximum price moved to the server query; URL state, stale-request cancellation, de-duplication, and load-more states are handled in the client. Malformed deep-link values are normalized before the first request. Public seller routes expose only id/name/city/createdAt plus derived initials/rating counts, include only active/sold inventory, and link from catalog/detail seller names. The additive `add_listing_pagination_indexes` migration supplies active-price and public-seller partial indexes.

Live evidence: a temporary seller, buyer, five equal-price/timestamp active listings, one sold listing, one draft, one eligible sold-interaction review, and a concurrent insert exercised both price directions, newest ties, filter composition, cursor/filter and catalog/seller scope mismatch rejection, safe seller shape, rating aggregation, and inventory state exclusion. The first matrix exposed a descending-price tie direction defect; explicit descending id order fixed it, and the complete rerun returned every original ID exactly once with no gaps or duplicates while omitting the newer concurrent row. Seller inventory returned seven active/sold rows, excluded the draft, and reported rating 4 from one eligible review.

Validation: lint, TypeScript, 17/17 unit tests, the 37-route production build, and 4/4 Playwright tests pass. Agent Browser returned 200 for both production APIs, exact filtered price-high order, exact seller inventory/rating, usable named filter controls, no console/page errors, and no horizontal overflow at 1440x900, 1024x768, 390x844, or 360x800. All temporary Auth users, public users, listings, reviews, cleanup jobs, and Storage objects were removed; final counts are zero. Development now has 13 migrations, 10 RLS public tables, 40 constraints, and 35 indexes. The security advisor is empty; new-index notices are informational only on the cleaned dataset. P1-003/P1-004 and ownership are released by this local checkpoint.

Next slice: continue with the highest independent P1 gap while P0-005 and protected image-route failure injection remain externally blocked by the missing development secret.

## 2026-07-14 — P1 image lifecycle implementation

Goal / acceptance IDs: P1-006; IMG-01, IMG-02, IMG-03, STOR-01, TEST-01.

Ownership: root exclusively owns the image-lifecycle slice: listing upload/create/update/delete routes, owned-image parsing and cleanup helpers, the create/edit image UI, the additive cleanup migration and generated types, focused tests, and durable documentation. No other agent is editing these files.

Starting state: clean branch `autonomous/bookswap-product` at `7078b00`. Upload validates one to five JPEG/PNG/WebP files at 5 MB and writes under the authenticated user folder, but browser preview URLs are never revoked. Create/edit failures do not compensate freshly uploaded objects, edit offers no image replacement/removal, successful replacement never removes obsolete objects, and listing deletion ignores Storage removal failures. Existing Storage policies are owner-folder scoped but have no functional cross-user evidence.

Implemented: added exact project/bucket/owner URL parsing that rejects foreign hosts/folders, nested/traversal paths, query/fragment variants, and unsupported names. Upload failure now cleans partial batches or persists cleanup; an authenticated DELETE accepts only unreferenced owner URLs. Create/edit compensate fresh uploads after validation, moderation, or mutation failure. Edit supports removal and replacement with accessible controls; create/edit revoke every blob preview. Listing image update/delete transactionally queues obsolete URLs, server draining rechecks all owner listings before Storage removal, failures retain attempt/error state, and API/UI make pending cleanup observable.

Database: applied `add_listing_image_cleanup_jobs`, `allow_owner_listing_image_selection`, `make_cleanup_jobs_service_only_explicit`, and `deduplicate_listing_image_cleanup_jobs` to bookswap-development. The queue is RLS-enabled, has revoked anon/authenticated grants plus an explicit false policy, service-role CRUD, one trigger, and a SECURITY DEFINER trigger function with `search_path=""`. The owner SELECT migration corrected a live discovery: public bucket delivery does not need RLS SELECT, but the Storage remove API does, so authenticated SELECT is limited to the caller's first folder segment. The final hardening migration makes repeated direct-input URLs queue exactly once. Generated types match. Current catalog counts are 12 migrations, 10/10 RLS public tables, 40 constraints, 33 indexes, and three Storage policies. The final database security advisor is empty; performance notices remain unused-index INFO only.

Live evidence: two temporary authenticated users proved own-folder upload, cross-folder upload denial, cross-user delete denial with object preservation, owner single/batch deletion, MIME denial, 5 MB + 1 byte denial, spoofed seller denial, and client denial on the cleanup queue. Replacing one of two images created an unreferenced job; deleting that listing created a second job for a URL shared by another listing. The shared reference and object remained. All temporary Auth users, profiles, listings, jobs, and objects were removed; final counts are zero.

Validation: lint, TypeScript, 14/14 unit tests, production build, and 4/4 Playwright tests pass. Agent Browser selected/removed a real PNG preview at 390x844, exposed an accessible remove name, observed blob count return to zero, and confirmed the captured URL was revoked. Create/profile widths match 1440, 1024, 390, and 360 viewports with zero console/page errors and no signed-out upload mutation. Protected Next route failure injection remains tied to P0-005's missing development service secret, so IMG-02/IMG-03 remain Partial and P1-006 is implemented but not launch-verified. Ownership is released by this local checkpoint.

Next slice: deterministic opaque catalog pagination and public seller inventory can proceed independently of the secret blocker.

Use one entry per autonomous slice. Record facts, ownership, migrations, validation, evidence, and remaining failures. Do not use this log as a completion claim.

## 2026-07-14 — P0 protected message delivery

Goal / acceptance IDs: P0-004; CHAT-02, DB-01, TEST-01.

Ownership: root exclusively owned the message-delivery slice: `app/api/chat/message/route.ts`, `hooks/use-chat.ts`, the focused source-contract test, and durable documentation. Deployed RLS/publication evidence proved the existing Postgres Changes path sufficient, so no migration was added. Ownership is released by this completed local checkpoint.

Starting state: clean branch `autonomous/bookswap-product` at `5ffb0a4`. `ChatPanel` already receives `public.messages` INSERT events through Postgres Changes and de-duplicates the optimistic HTTP result. The send route additionally emits the same private message on public `room:{id}` Broadcast without `realtime.messages` authorization. The dormant `useChat` hook listens to both paths and can duplicate or accept unprotected payloads. Official Supabase documentation confirms Postgres Changes respects table SELECT RLS, while secure Broadcast would require private channels, `realtime.messages` policies, and disabled public access.

Implemented: deleted the send route's public `room:{id}` Broadcast, removed the dormant hook's Broadcast listener, aligned the hook channel name with the active message path, and de-duplicated Postgres Changes by message ID. Added a source-contract unit test that requires Postgres Changes in both clients and rejects Broadcast/channel sends in the route.

Backend evidence: buyer message insert succeeds; seller reads it; third user reads zero; nonmember send, spoofed sender, banned sender, and anonymous read fail. A real authenticated WebSocket test explicitly set each access token, subscribed buyer/seller/third clients to the room-filtered `public.messages` INSERT stream, and inserted through the buyer's RLS client. Buyer and seller each received the matching row; the third subscriber received zero. `messages` is present once in `supabase_realtime`, RLS is enabled, and exactly one member SELECT and one active-member INSERT policy are deployed. Advisors are unchanged.

Validation: lint, TypeScript, 11/11 unit tests, production build, and 4/4 Playwright tests pass. Agent Browser shows the signed-out messages state at 1440x900, 1024x768, 390x844, and 360x800 with scroll width equal to viewport, no protected chat request, and no console/page errors. All temporary Auth/profile/listing/room/message fixtures were deleted and zero rows remain. Live protected route-handler testing still belongs to P0-005 because the development service secret is unavailable.

## 2026-07-14 — P0 favorite visibility

Goal / acceptance IDs: P0-003; FAV-01, SVC-01, DB-01, TEST-01.

Ownership: root exclusively owned the favorites authorization slice: `app/api/favorites/route.ts`, the focused listing-visibility helper/tests, two additive favorites migrations, the related book-card interaction fix, and durable documentation. No other agent edited those files. Ownership is released by this completed local checkpoint.

Starting state: clean branch `autonomous/bookswap-product` at `cd4ecef`. The service-role GET embeds every favorited listing without constraining listing/seller state; the saved-state probe ignores target visibility; POST can create a favorite for a known non-public listing; database favorite policies constrain only `user_id`. DELETE is correctly requester-scoped and must continue to remove stale favorites. The development service secret is still unavailable, so route behavior requires focused code-level tests plus direct authenticated RLS/Data API evidence.

Implemented: added a shared active/sold plus active-seller response predicate; explicit foreign-key inner embeds and state/seller filters on privileged reads; pre-write target validation; race-safe 23514 mapping; correct 500 defaults for unexpected database faults; a private stable/strict visibility predicate; a private before-write trigger that also constrains service-role writes; RLS checks for requester, banned user, target state, and seller state; and preserved requester-scoped deletion/cascade behavior. Browser inspection found the mobile heart button covered by the cover title, so its stacking layer and dynamic accessible name were corrected.

Backend evidence: active and sold favorites are the only rows visible to the buyer; the other user sees only its own row; a saved listing transitioned to draft is hidden. Draft, locked, banned-seller, banned-reader, spoofed-user, and anonymous inserts fail; the valid active target succeeds; a direct authenticated Data API join returns 200 with only active/sold rows and exactly safe seller keys; deleting a listing leaves zero orphan favorites. Both private functions have empty search paths and restricted ACLs, the trigger is enabled, all three deployed policies contain the intended predicates, generated public types remain stable, and advisors add no new actionable schema finding.

Validation: lint, TypeScript, 10/10 unit tests, production build, and 4/4 Playwright tests pass. Agent Browser at 390x844 shows the signed-out favorites state with no overflow/errors; after the stacking fix the catalog heart is clickable, redirects to `/login`, emits no favorites request without a session, and records no console/page errors. All temporary Auth/profile/listing/favorite fixtures were deleted and zero rows remain. Protected Next-route live testing remains part of P0-005 because the development service secret is unavailable.

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
