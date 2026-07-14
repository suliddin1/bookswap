# BookSwap issue queue

Last triaged: 2026-07-14. Select one coherent acceptance slice at a time. P0 precedes feature work; P1 launch blockers precede optional P2 refinement. Status “Ready” means the issue is sufficiently evidenced to implement, not that the product is ready.

## P0 — stop-ship

| ID | Issue and required outcome | Evidence | Dependencies / owner | Acceptance | Status |
| --- | --- | --- | --- | --- | --- |
| P0-001 | Restore public catalog compatibility without granting private users columns. Introduce a safe public-profile query contract/view/table and update embedded queries; signed-out catalog/detail must return eligible listings and safe seller fields with zero 5xx. | Resolved by the private `user_is_active` predicate and rewritten listing policies. Safe profile/listing reads return 200; email and `*` profile reads remain denied; banned sellers and their listings disappear. | Completed in `fix_chat_room_seller_authorization`; Database + Security/API ownership released. | CAT-01, PROF-01, BROW-01 | Complete |
| P0-002 | Correct chat-room ownership authorization with fully qualified columns and adversarial tests. A buyer must not supply a seller other than the active listing owner. | Resolved with qualified RLS, a composite `(listing_id, seller_id)` foreign key, explicit route ban/state checks, and buyer/other/banned/spoofed/self/anonymous adversarial tests. | Completed in `fix_chat_room_seller_authorization` plus `add_chat_room_listing_seller_index`; ownership released. | CHAT-01, DB-01, SVC-01 | Complete |
| P0-003 | Prevent favorite-based non-public listing disclosure. Service-role query must return only requester-visible listing states and handle status transitions/deletion. | Resolved with query-side active/sold and active-seller filters, response defense, pre-write validation, an atomic trigger invariant, visibility-aware RLS, banned-user denial, safe stale-state hiding/removal, and delete cascade evidence. | Completed in `secure_favorite_listing_visibility` plus `restrict_banned_user_favorite_access`; Security/API ownership released. | FAV-01, SVC-01 | Complete |
| P0-004 | Remove redundant public room broadcast or implement verified private Realtime authorization. Keep one protected delivery path. | chat message route broadcasts to room:{id}; ChatPanel already uses RLS-protected Postgres Changes. | Security/API owner; Realtime tests and official private-channel pattern. | CHAT-02, DB-01 | Ready |
| P0-005 | Execute a complete service-role route authorization matrix once a dev secret is available: signed out, owner/member, other user, banned user, non-admin/admin, invalid state, guessed ID. Fix every bypass before feature work proceeds. | Source review found two bypasses; no local dev service secret is available. | External secret configuration, then Security/API owner. | AUTH-03, ADMIN-01, SVC-01 | Blocked |

## P1 — launch blockers

| ID | Issue and required outcome | Dependencies / owner | Acceptance | Status |
| --- | --- | --- | --- | --- |
| P1-001 | Add title/edition identity and explicit sale/exchange/both intention through additive migrations; preserve all existing sale listings and fast creation. | Product decision on exchange-only price/partial-cash; Database + domain owner. | LIST-02, LIST-03, EXCH-01 | Decision needed |
| P1-002 | Add saved titles, privacy-explicit reader shelves, wanted list, and privacy-safe exchange matching/dismissal. | P1-001 and shelf privacy defaults. | SHELF-01, EXCH-01 | Pending |
| P1-003 | Implement public seller profile and cursor-paginated eligible seller inventory using safe profile contract. | P0-001; domain/API/UI owners. | PROF-02, PAGE-01 | Pending |
| P1-004 | Implement deterministic opaque cursor pagination for catalog and seller inventory; cover equal sort values and concurrent inserts. | P0-001; ADR-010. | PAGE-01, PERF-01 | Pending |
| P1-005 | Expand book-native search/filter fields and multilingual relevance fixtures without making optional metadata mandatory. | P1-001 schema. | SEARCH-01, FILTER-01 | Pending |
| P1-006 | Complete image lifecycle: preview URL cleanup, replace/remove UI, failed mutation compensation, listing-delete cleanup, and cross-user tests. | Storage/API/UI ownership coordination. | IMG-01, IMG-02, IMG-03 | Ready |
| P1-007 | Add per-user chat read state/unread counts and durable notification delivery with observable failures. | P0-002/P0-004; Realtime design. | CHAT-03, NOTIF-01 | Pending |
| P1-008 | Replace absent-provider “Demo ... passed” moderation success with explicit unavailable/degraded behavior and auditable decisions. | Moderation provider/product policy. | MOD-01 | Ready |
| P1-009 | Add immutable admin audit history and verify all admin/report/privacy/appeal actions. Make dashboard surface query failures. | Database + Security/API owners. | ADMIN-01, ADMIN-02, REP-01 | Ready |
| P1-010 | Make the product Azerbaijani-first: string system, lang=az, navigation/forms/states/legal/metadata/notifications, AZN and locale formatting. | Legal operator/contact decisions for legal pages. | L10N-01, SEO-01 | Ready in slices |
| P1-011 | Complete WCAG 2.2 AA review and targeted fixes: small text, keyboard/focus, labels/status, contrast, touch, zoom/reflow, motion. | UI preservation rules. | A11Y-01, RESP-01 | Ready |
| P1-012 | Remove core console/network errors and extend browser coverage to authenticated buyer/seller/admin journeys at four viewports. | P0 fixes and dev secret. | BROW-01, RESP-01, TEST-01 | Blocked |
| P1-013 | Replace in-memory-only rate limiting with deploy-compatible abuse controls; add monitoring, logs, alerts, backups, and rollback evidence. | Hosting/monitoring decisions. | DEPLOY-01 | Decision needed |
| P1-014 | Define production backend/domain/environment separation and safely provision only after explicit authorization; never promote development credentials. | User authorization and production choices. | DEPLOY-01 | Decision needed |
| P1-015 | Reduce marketplace client/bundle/image cost with pagination, smaller client boundaries, and optimized covers; set measurable budgets. | P0-001, P1-004; performance evidence. | PERF-01 | Pending |
| P1-016 | Expand automated coverage for RLS, authorization, image lifecycle, errors, exchange, moderation, admin audit, accessibility, and multilingual search. | Each feature slice. | TEST-01 | Ongoing |
| P1-017 | Resolve leaked-password protection before production: enable Supabase's Pro-only protection with explicit cost authorization or adopt a documented passwordless/compensating-control decision. | Production plan and cost authorization; free development project cannot enable the advisor recommendation. | AUTH-01, DEPLOY-01 | Decision needed |

## P2 — quality and maintainability

| ID | Issue and outcome | Acceptance / notes | Status |
| --- | --- | --- | --- |
| P2-001 | Remove or justify unused hooks/routes/dependencies after usage verification: use-chat, app/api/auth/[action], @supabase/ssr, @headlessui/react, clsx. | Keep changes narrow; no dependency churn during P0 work. | Pending |
| P2-002 | Replace broad any usage with generated/domain types and typed response contracts. | Type quality; preserve API behavior. | Pending |
| P2-003 | Await or durably enqueue required notifications instead of fire-and-forget work in request lifetimes. | NOTIF-01. | Pending |
| P2-004 | Add same-seller bundle discovery after seller pages and stable inventory pagination. | Optional product capability. | Pending |
| P2-005 | Review CSP unsafe-inline allowances and adopt nonces/hashes where compatible with Next.js; decide how local React Refresh should run without weakening the production policy. | Production browser is clean; `next dev` React Refresh currently logs an `unsafe-eval` CSP violation. | Pending |
| P2-006 | Establish representative-data query plans before acting on new-database unused-index advisor notices. | Do not remove protective indexes from an empty project. | Pending |
