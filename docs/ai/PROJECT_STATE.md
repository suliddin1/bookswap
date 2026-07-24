# Project state

Snapshot date: 2026-07-24.

## Repository protection

- Active and only authorized repository: D:\Codex Projects\2HandedBook.
- Protected out-of-scope checkout: D:\GitHub\BookSwap.
- Branch: autonomous/bookswap-product.
- Initial repository checkpoint: d644ad2b5775ae98386ae96636f23d5f530b0ef1, chore: checkpoint existing BookSwap development state.
- That initial checkpoint captured 86 legitimate files (5,497 insertions, 452 deletions) after ignored/untracked/secret/whitespace review.
- Latest pre-slice checkpoint: 46eb77c, feat: instrument marketplace web vitals.
- Remote: origin points to https://github.com/suliddin1/bookswap.git. Nothing was pushed.
- Preparation and subsequent implementation/authorization checkpoints are local. Current checkpoints extend Azerbaijani coverage through centralized public FAQ/safety guidance and WCAG 2.2 AA remediation through the shared shell, home/catalog discovery, public listing-detail/seller-action journey, listing authoring/editing, authentication/recovery, profile/privacy requests, messages, room chat, notifications, moderation review, and the administrator dashboard, without touching the protected checkout or remote.

Top-level tracked product/config includes .github, app, components, docs, hooks, lib, public, scripts, supabase, tests, package.json, package-lock.json, Next/Tailwind/TypeScript/ESLint/Playwright configuration, examples, and README. The .git directory, package.json, and application source are present. Local .env.local, node_modules, .next, caches, Playwright artifacts, test-results, .vercel, and tsbuildinfo are ignored.

## Current stack

- Next.js 15.5.19 App Router; React/React DOM 18.2.
- TypeScript 5.9.3 installed under strict project settings.
- Tailwind CSS 3.4.19; Fraunces and Manrope visual system.
- Supabase JS 2.108.1 installed; Auth/Postgres/Storage/Realtime architecture.
- Zod 3.25.76 and Lucide React 0.344. Decorative marketplace motion is CSS-only; Framer Motion is no longer shipped.
- Vitest 4.1.8, Playwright 1.60, ESLint 8.57.
- npm with committed package-lock.json.

## Existing functional foundation

Public/user routes exist for home, catalog, listing detail/new/edit, login/recovery, profile, favorites, messages/chat, notifications, FAQ, safety, privacy, terms, user rights, admin, errors, loading, and custom 404. API routes cover listings, upload, profile, favorites, chat, notifications, reviews, reports, privacy requests, moderation, authentication, and admin actions.

The database contains users, listings, chat_rooms, per-participant chat_room_reads, messages, reviews, notifications, favorites, reports, privacy_requests, the service-only listing image cleanup queue, a content-minimized moderation decision ledger, and an immutable administrator action ledger; listing_status and notification_type enums; a public listing-images bucket; and Realtime publication for messages, notifications, and read state. Existing features are foundation work, not a request to rebuild them.

Known absent product areas include explicit exchange intention, title/edition identity, reader shelves/wanted titles, exchange matching, and complete Azerbaijani-first coverage. The root document/metadata/manifest, shell/global states, discovery, listing detail/create/edit, public seller, favorites, login/signup/recovery, profile dashboard, reader privacy requests, user-rights route, messages, room chat, notifications, administrator dashboard/actions, code-authored API error responses, optional notification email presentation, FAQ/safety guidance, marketplace labels, AZN, and deterministic Baku date/time formatting are now Azerbaijani. Migration-authored legacy notification prose and reviewed legal surfaces remain inventoried work. Public seller pages, stable catalog/seller pagination, cross-device message unread state, fail-closed moderation, and transactional administrator history exist. Image lifecycle implementation exists, but protected route failure injection still awaits the development service secret.

## Development backend

- Project: bookswap-development.
- Ref: uibatsbzjswmtdvdrlxj.
- Region: eu-central-1.
- Plan/cost at creation: authorized organization free plan; project cost reported as 0 monthly.
- Status during audit: ACTIVE_HEALTHY, PostgreSQL 17.
- No production project was modified. The unavailable legacy bookswap project was not restored or changed.
- Repository migrations applied in order: init, marketplace_upgrade, production_hardening, security_marketplace_hardening, fix_chat_room_seller_authorization, add_chat_room_listing_seller_index, secure_favorite_listing_visibility, restrict_banned_user_favorite_access, add_listing_image_cleanup_jobs, allow_owner_listing_image_selection, make_cleanup_jobs_service_only_explicit, deduplicate_listing_image_cleanup_jobs, add_listing_pagination_indexes, add_chat_read_state_and_durable_notifications, add_reviewable_moderation_decisions, add_transactional_admin_audit, require_protected_listing_mutations, add_public_marketplace_page_rpcs, contain_marketplace_page_rpcs, reject_null_marketplace_sort.
- Verified: 13 RLS-enabled public tables; 61 constraints; 47 indexes; client-denied service boundaries for cleanup/read-state/moderation/admin history; browser roles have listing SELECT but no INSERT/UPDATE/DELETE while service role has explicit CRUD; service-role SELECT-only admin ledger and service-execute-only transactional action RPCs; three owner-folder Storage policies; protected profile grants; private user/favorite predicates; composite room ownership; atomic favorite/image/message-notification/admin-audit behavior; listing-images bucket limits; messages/notifications/read-state Realtime publication; stable catalog/seller cursors; caller-context public marketplace wrappers over fixed private readers; restricted security-definer functions; and schema-derived TypeScript generation.
- Functional Auth test passed: a temporary Auth user created one safe profile and deletion cascaded; no test row remains.
- Security advisor reports one external warning: leaked-password protection is disabled because that feature is available only on Supabase Pro and above. Enabling paid service requires explicit authorization; track it as a production decision rather than changing plan or cost autonomously.
- The schema-focused database security lint returns no findings. The separately reported Pro-only leaked-password Auth decision remains unresolved because no paid plan was authorized.
- A rollback-safe 60,000-listing/200-seller/9,000-review development probe now supplies representative catalog/seller query plans. Active-created, active-price/id, public-seller/created/id, full-text GIN, filter, user-primary-key, and review-listing indexes are exercised; the performance advisor retains only unrelated empty-project unused-index information. Do not remove the remaining protective indexes without workload-specific evidence.

## Compatibility and blockers

The backend schema matches the repository migrations and generated type shape. Public catalog and detail compatibility and chat-room ownership are now fixed. Remaining critical compatibility/security work is:

1. The connector provides public project configuration but not a service-role/secret key. Full protected-route browser verification therefore remains externally blocked until a development secret is configured locally outside Git.
2. The free development project cannot enable the Pro-only leaked-password protection advisor recommendation without explicit cost authorization.
3. The ignored local `.env.local` currently points its public Supabase URL at project ref `lnhublqrtkdrrafghvki`, not the authorized development ref `uibatsbzjswmtdvdrlxj`. It was preserved rather than silently repointed; authenticated localization evidence therefore used browser-local representative responses and a mocked Realtime socket. Correct development public configuration plus the missing server secret remain required for truthful protected-route runtime evidence.

## Baseline

Current repository gate: lint pass; strict TypeScript pass; 44/44 unit tests; production build pass with 38 generated pages; manifest gzip budgets pass; 21/21 Playwright tests pass with four bounded workers. Shared App Router JavaScript is 102 kB first-load / 100.1 KiB gzip. Home, catalog, listing detail, and seller storefront are 189, 192, 193, and 190 kB first-load respectively, down from 225, 225, 231, and 223 kB at the performance slice's untouched baseline. Persisted Supabase covers use the Next image optimizer, responsive candidates, explicit size contracts, and lazy loading; browser-only blob/data previews retain raw images. The home editorial shell is server-rendered around two small data islands that share one request; decorative Framer Motion runtime is removed. Version-controlled gzip ceilings pass at shared 100.1/105 KiB, home 184.8/195, catalog 187.6/195, listing detail 188.8/200, and seller storefront 185.4/195. Fixture-backed optimized production passes the four required viewports on home, catalog, listing detail, and seller storefront with exact base/200% widths, responsive optimized cover requests no wider than 640px, one home listings request, and zero unexpected console/page/request/HTTP/hydration/overlay failures.

Representative database evidence now covers newest/price cursor pages, rare full-text search, combined filters, seller inventory, and sold-review joins. The original PostgREST disjunction and anonymous RLS security barrier caused 21,000-49,000 post-index discards and approximately 45-359ms warm execution at 60,000 listings. Fixed private readers now use row-value cursors and explicit public visibility behind caller-context public wrappers: ordered cursor paths discard zero rows, touch 18-65 shared buffers, and execute in approximately 0.09-1.04ms; rare search is approximately 4.44ms. Anonymous runtime probes exclude banned sellers and non-public states, reject invalid limits and null sorts, security advisor is clean, generated RPC types are present, and all representative fixtures/statistics are removed/restored.

Production-capable RUM code now uses a tiny `next/web-vitals` client island plus `/api/vitals`. It is disabled unless `WEB_VITALS_ENABLED=true` is present at build and runtime, sends only LCP/CLS/INP for home, catalog, listing detail, and seller-storefront route groups, and excludes dynamic/raw URLs, queries, metric IDs, performance entries, referrers, users, sessions, and every private route. The endpoint accepts at most 1 KiB strict same-origin JSON, applies the existing bounded request throttle, and writes aggregation-ready structured logs only. An enabled 16-case optimized-production matrix emitted all three metrics for every route/viewport combination: 48 accepted structured events, exact privacy-safe fields, exact base/200% widths, and zero console/page/unexpected-request/HTTP/hydration/overlay failures. The first run exposed and repaired a proxy/public-origin comparison that rejected valid beacons. Bundle budgets remain exactly 100.1 KiB shared and 184.2-187.3 KiB per representative route. Synthetic diagnostics and local RUM prove transport/runtime behavior only; no production flag, deployment, external provider, retention policy, representative traffic, or field p75 evidence exists. PERF-01 therefore remains Partial and P1-015's field-evidence remainder is externally blocked.

Public marketplace consumers now validate complete listing-page, listing-detail/review, and seller-page success shapes before data reaches React render paths. Non-OK responses, invalid JSON, malformed arrays/cursors/listings/reviews/seller summaries, non-finite numbers, and invalid seller timestamps settle into the existing Azerbaijani unavailable states instead of exposing provider/parser text or causing a client exception. Permanent tests cover the parser contract and home/catalog/detail/seller failure presentation. A separate optimized-production failure matrix covers all four routes at 1440x900, 1024x768, 390x844, and 360x800 with one expected injected 503 per home case, malformed-success/invalid-JSON failures elsewhere, exact base/200% widths, reduced motion, and zero unexpected console/page/request/HTTP/hydration/overlay failures.

The known wrong-project public configuration and missing service secret remain the explicit unmocked protected-route boundary. The authorized development project was not touched in the RUM slice; no production, database, Auth, listing/review row, Storage, provider, deployment, remote, or protected-checkout mutation occurred. Temporary screenshots, scripts, server output, and Playwright result files are removed after evidence capture. See QA_EVIDENCE.md.

## Readiness

Autonomous development is active. P0-001 through P0-004, P0-006, P1-003/P1-004/P1-007/P1-008/P1-009, and P1-011 are complete; P0-005 is the only remaining P0 and is externally blocked by the missing development secret. P1-006 is implemented and directly tested but its protected route gate shares that blocker. P1-010's remaining SQL/legal work is externally blocked. P1-015 now has pagination, representative catalog/seller query-plan evidence, smaller marketplace client boundaries, optimized cover delivery, measured bundle baselines, enforced gzip ceilings, four-viewport runtime evidence, and production-capable privacy-minimized RUM instrumentation. Its remaining field p75 evidence requires an authorized production deployment, log/metrics owner and retention decision, activation, and representative traffic; local samples do not close the gate. P1-016 now includes deterministic public marketplace non-OK, invalid-JSON, and malformed-success coverage plus render-boundary response validation, but remains the highest-priority unblocked ongoing engineering item because broader launch-critical failure/coverage mapping is incomplete. Exchange/shelf/search items remain decision- or dependency-bound. The product is not complete or launch-ready.
