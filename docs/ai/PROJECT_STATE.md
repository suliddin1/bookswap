# Project state

Snapshot date: 2026-07-19.

## Repository protection

- Active and only authorized repository: D:\Codex Projects\2HandedBook.
- Protected out-of-scope checkout: D:\GitHub\BookSwap.
- Branch: autonomous/bookswap-product.
- Checkpoint: d644ad2b5775ae98386ae96636f23d5f530b0ef1, chore: checkpoint existing BookSwap development state.
- Checkpoint captured 86 legitimate files (5,497 insertions, 452 deletions) after ignored/untracked/secret/whitespace review.
- Remote: origin points to https://github.com/suliddin1/bookswap.git. Nothing was pushed.
- Preparation and subsequent implementation/authorization checkpoints are local. Current checkpoints extend Azerbaijani coverage through centralized public FAQ/safety guidance and WCAG 2.2 AA remediation through the shared shell, home/catalog discovery, public listing-detail/seller-action journey, listing authoring/editing, authentication/recovery, and profile/privacy-request journeys, without touching the protected checkout or remote.

Top-level tracked product/config includes .github, app, components, docs, hooks, lib, public, scripts, supabase, tests, package.json, package-lock.json, Next/Tailwind/TypeScript/ESLint/Playwright configuration, examples, and README. The .git directory, package.json, and application source are present. Local .env.local, node_modules, .next, caches, Playwright artifacts, test-results, .vercel, and tsbuildinfo are ignored.

## Current stack

- Next.js 15.5.19 App Router; React/React DOM 18.2.
- TypeScript 5.9.3 installed under strict project settings.
- Tailwind CSS 3.4.19; Fraunces and Manrope visual system.
- Supabase JS 2.108.1 installed; Auth/Postgres/Storage/Realtime architecture.
- Zod 3.25.76, Framer Motion 12.40, Lucide React 0.344.
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
- Repository migrations applied in order: init, marketplace_upgrade, production_hardening, security_marketplace_hardening, fix_chat_room_seller_authorization, add_chat_room_listing_seller_index, secure_favorite_listing_visibility, restrict_banned_user_favorite_access, add_listing_image_cleanup_jobs, allow_owner_listing_image_selection, make_cleanup_jobs_service_only_explicit, deduplicate_listing_image_cleanup_jobs, add_listing_pagination_indexes, add_chat_read_state_and_durable_notifications, add_reviewable_moderation_decisions, add_transactional_admin_audit, require_protected_listing_mutations.
- Verified: 13 RLS-enabled public tables; 61 constraints; 47 indexes; client-denied service boundaries for cleanup/read-state/moderation/admin history; browser roles have listing SELECT but no INSERT/UPDATE/DELETE while service role has explicit CRUD; service-role SELECT-only admin ledger and service-execute-only transactional action RPCs; three owner-folder Storage policies; protected profile grants; private user/favorite predicates; composite room ownership; atomic favorite/image/message-notification/admin-audit behavior; listing-images bucket limits; messages/notifications/read-state Realtime publication; stable catalog/seller cursors; restricted security-definer functions; and schema-derived TypeScript generation.
- Functional Auth test passed: a temporary Auth user created one safe profile and deletion cascaded; no test row remains.
- Security advisor reports one external warning: leaked-password protection is disabled because that feature is available only on Supabase Pro and above. Enabling paid service requires explicit authorization; track it as a production decision rather than changing plan or cost autonomously.
- The schema-focused database security lint returns no findings. The separately reported Pro-only leaked-password Auth decision remains unresolved because no paid plan was authorized.
- Performance advisor reports only expected unused-index informational findings on an empty new database; the composite foreign-key missing-index notice was resolved. Do not remove protective indexes until representative query evidence exists.

## Compatibility and blockers

The backend schema matches the repository migrations and generated type shape. Public catalog and detail compatibility and chat-room ownership are now fixed. Remaining critical compatibility/security work is:

1. The connector provides public project configuration but not a service-role/secret key. Full protected-route browser verification therefore remains externally blocked until a development secret is configured locally outside Git.
2. The free development project cannot enable the Pro-only leaked-password protection advisor recommendation without explicit cost authorization.
3. The ignored local `.env.local` currently points its public Supabase URL at project ref `lnhublqrtkdrrafghvki`, not the authorized development ref `uibatsbzjswmtdvdrlxj`. It was preserved rather than silently repointed; authenticated localization evidence therefore used browser-local representative responses and a mocked Realtime socket. Correct development public configuration plus the missing server secret remain required for truthful protected-route runtime evidence.

## Baseline

Current repository gate: lint pass; strict TypeScript pass; 38/38 unit tests; production build pass with 37 generated routes; 16/16 Playwright tests. The shared shell/home/catalog and listing-detail accessibility foundations retain their keyboard, naming/state, contrast, target, reduced-motion, and constrained-reflow contracts. Listing authoring and authentication retain named/focus-managed progress, modes, validation, busy/loading/photo/error relationships, input-purpose tokens, a 12px essential-text floor, 44px owned controls, and 320px/200% reflow. Profile now keeps one page `main`, uses a named roving-focus tablist and labelled panel, clears prior-account data before refetch, refreshes normalized uncontrolled form defaults safely, and gives profile/listing feedback deterministic live focus. Profile and privacy forms provide localized first-invalid-control focus and explicit error/help relationships; essential copy and request states meet the shared text/contrast floor. The authenticated account header wraps under enlargement and exposes sign-out in its compact menu. Fixture-backed optimized-production profile/user-rights routes pass all eight route/viewport cases at 1440x900, 1024x768, 390x844, and 360x800 with exact base/200% widths, clean visuals, and zero console/page/unexpected-request/HTTP/hydration/overlay failures. The known wrong-project public configuration and missing service secret remain the explicit unmocked protected-route boundary, so fixture evidence is UI/runtime-only. No backend, Auth, profile, listing, privacy-request, or external mutation was submitted. Temporary screenshots, scripts, server output, and Playwright result files are removed after evidence capture. See QA_EVIDENCE.md.

## Readiness

Autonomous development is active. P0-001 through P0-004, P0-006, and P1-003/P1-004/P1-007/P1-008/P1-009 are complete; P0-005 is the only remaining P0 and is externally blocked by the missing development secret. P1-006 is implemented and directly tested but its protected route gate shares that blocker. P1-010's remaining SQL/legal work is externally blocked. P1-011 is in progress: the shared shell, public home/catalog discovery, public listing detail/seller actions, listing authoring/editing, login/signup/recovery/password-reset, and profile/privacy-request journeys are complete accessibility slices, while messaging/notifications, moderation, and administrator surfaces still need systematic WCAG review. The next highest-priority unblocked slice is messaging and notification accessibility, including private state structure, composer/action feedback focus, target/contrast review, and 200% reflow; the product is not complete or launch-ready.
