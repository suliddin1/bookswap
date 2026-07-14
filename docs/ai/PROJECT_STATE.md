# Project state

Snapshot date: 2026-07-14.

## Repository protection

- Active and only authorized repository: D:\Codex Projects\2HandedBook.
- Protected out-of-scope checkout: D:\GitHub\BookSwap.
- Branch: autonomous/bookswap-product.
- Checkpoint: d644ad2b5775ae98386ae96636f23d5f530b0ef1, chore: checkpoint existing BookSwap development state.
- Checkpoint captured 86 legitimate files (5,497 insertions, 452 deletions) after ignored/untracked/secret/whitespace review.
- Remote: origin points to https://github.com/suliddin1/bookswap.git. Nothing was pushed.
- Preparation and six implementation/authorization checkpoints are local; the current slice adds durable unread/notification state without touching the protected checkout or remote.

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

The database contains users, listings, chat_rooms, per-participant chat_room_reads, messages, reviews, notifications, favorites, reports, privacy_requests, and the service-only listing image cleanup queue; listing_status and notification_type enums; a public listing-images bucket; and Realtime publication for messages, notifications, and read state. Existing features are foundation work, not a request to rebuild them.

Known absent product areas include explicit exchange intention, title/edition identity, reader shelves/wanted titles, exchange matching, admin audit history, and Azerbaijani-first localization. Public seller pages, stable catalog/seller pagination, and cross-device message unread state now exist. Image lifecycle implementation exists, but protected route failure injection still awaits the development service secret.

## Development backend

- Project: bookswap-development.
- Ref: uibatsbzjswmtdvdrlxj.
- Region: eu-central-1.
- Plan/cost at creation: authorized organization free plan; project cost reported as 0 monthly.
- Status during audit: ACTIVE_HEALTHY, PostgreSQL 17.
- No production project was modified. The unavailable legacy bookswap project was not restored or changed.
- Repository migrations applied in order: init, marketplace_upgrade, production_hardening, security_marketplace_hardening, fix_chat_room_seller_authorization, add_chat_room_listing_seller_index, secure_favorite_listing_visibility, restrict_banned_user_favorite_access, add_listing_image_cleanup_jobs, allow_owner_listing_image_selection, make_cleanup_jobs_service_only_explicit, deduplicate_listing_image_cleanup_jobs, add_listing_pagination_indexes, add_chat_read_state_and_durable_notifications.
- Verified: 11 RLS-enabled public tables; 45 constraints; 40 indexes; a client-denied/service-only cleanup queue and read-state mutation boundary; three owner-folder Storage policies; protected profile grants; private user/favorite predicates; composite room ownership; atomic favorite/image/message-notification triggers; listing-images bucket limits; messages/notifications/read-state Realtime publication; stable catalog/seller cursors; restricted security-definer functions; and schema-derived TypeScript generation.
- Functional Auth test passed: a temporary Auth user created one safe profile and deletion cascaded; no test row remains.
- Security advisor reports one external warning: leaked-password protection is disabled because that feature is available only on Supabase Pro and above. Enabling paid service requires explicit authorization; track it as a production decision rather than changing plan or cost autonomously.
- The schema-focused database security lint returns no findings. The separately reported Pro-only leaked-password Auth decision remains unresolved because no paid plan was authorized.
- Performance advisor reports only expected unused-index informational findings on an empty new database; the composite foreign-key missing-index notice was resolved. Do not remove protective indexes until representative query evidence exists.

## Compatibility and blockers

The backend schema matches the repository migrations and generated type shape. Public catalog and detail compatibility and chat-room ownership are now fixed. Remaining critical compatibility/security work is:

1. The connector provides public project configuration but not a service-role/secret key. Full protected-route browser verification therefore remains externally blocked until a development secret is configured locally outside Git.
2. The free development project cannot enable the Pro-only leaked-password protection advisor recommendation without explicit cost authorization.

## Baseline

Passed after the current unread/notification slice: lint, TypeScript, 17/17 unit tests, production build (37 generated routes), and 4/4 Playwright tests. Live three-user count/read/notification/RLS/Realtime/reconnect cases pass; signed-in mobile/desktop badges update 1→0→1 without overflow or errors at four viewports. Catalog/detail/seller pagination, favorites, protected message delivery, and image lifecycle evidence remain intact. All current fixtures are cleaned. `next dev` still logs a React Refresh `unsafe-eval` CSP incompatibility, while the production build remains clean. See QA_EVIDENCE.md.

## Readiness

Goal mode is active. P0-001 through P0-004 and P1-003/P1-004/P1-007 are complete; P0-005 is the only remaining P0 and is externally blocked by the missing development secret. P1-006 is implemented and directly tested but its protected route gate shares that blocker. Independent P1 work continues while the external action remains outstanding. The product is not complete or launch-ready.
