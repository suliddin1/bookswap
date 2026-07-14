# Project state

Snapshot date: 2026-07-14.

## Repository protection

- Active and only authorized repository: D:\Codex Projects\2HandedBook.
- Protected out-of-scope checkout: D:\GitHub\BookSwap.
- Branch: autonomous/bookswap-product.
- Checkpoint: d644ad2b5775ae98386ae96636f23d5f530b0ef1, chore: checkpoint existing BookSwap development state.
- Checkpoint captured 86 legitimate files (5,497 insertions, 452 deletions) after ignored/untracked/secret/whitespace review.
- Remote: origin points to https://github.com/suliddin1/bookswap.git. Nothing was pushed.
- Preparation was committed locally; the current autonomous slice restores catalog reads and enforces chat-room seller ownership without touching the protected checkout or remote.

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

The database contains users, listings, chat_rooms, messages, reviews, notifications, favorites, reports, and privacy_requests; listing_status and notification_type enums; a public listing-images bucket; and Realtime publication for messages and notifications. Existing features are foundation work, not a request to rebuild them.

Known absent product areas include explicit exchange intention, title/edition identity, reader shelves/wanted titles, exchange matching, seller public pages, cursor pagination, message unread state, full image lifecycle, admin audit history, and Azerbaijani-first localization.

## Development backend

- Project: bookswap-development.
- Ref: uibatsbzjswmtdvdrlxj.
- Region: eu-central-1.
- Plan/cost at creation: authorized organization free plan; project cost reported as 0 monthly.
- Status during audit: ACTIVE_HEALTHY, PostgreSQL 17.
- No production project was modified. The unavailable legacy bookswap project was not restored or changed.
- Repository migrations applied in order: init, marketplace_upgrade, production_hardening, security_marketplace_hardening, fix_chat_room_seller_authorization, add_chat_room_listing_seller_index.
- Verified: 9 RLS-enabled public tables; 37 constraints; 30 indexes; 21 public-table policies plus 2 Storage policies; column grants protecting private profile/admin fields; non-exposed private active-user predicate; composite chat-room listing/seller ownership; listing-images bucket (public read, 5 MB, JPEG/PNG/WebP); messages and notifications Realtime publication; restricted security-definer functions; and schema-derived TypeScript generation.
- Functional Auth test passed: a temporary Auth user created one safe profile and deletion cascaded; no test row remains.
- Security advisor reports one external warning: leaked-password protection is disabled because that feature is available only on Supabase Pro and above. Enabling paid service requires explicit authorization; track it as a production decision rather than changing plan or cost autonomously.
- Performance advisor reports only expected unused-index informational findings on an empty new database; the composite foreign-key missing-index notice was resolved. Do not remove protective indexes until representative query evidence exists.

## Compatibility and blockers

The backend schema matches the repository migrations and generated type shape. Public catalog and detail compatibility and chat-room ownership are now fixed. Remaining critical compatibility/security work is:

1. Favorite retrieval uses service role without restricting joined listings to requester-visible state.
2. Chat message code emits an additional room broadcast without private-channel authorization.
3. The connector provides public project configuration but not a service-role/secret key. Full protected-route browser verification therefore remains externally blocked until a development secret is configured locally outside Git.
4. The free development project cannot enable the Pro-only leaked-password protection advisor recommendation without explicit cost authorization.

## Baseline

Passed after the P0 authorization slice: lint, TypeScript, 9/9 unit tests, production build (37 generated routes), and 4/4 existing Playwright tests. Real catalog and detail APIs return 200 with safe sellers; four-viewport production rendering has meaningful content, no horizontal overflow, and no console/page errors. `next dev` still logs a React Refresh `unsafe-eval` CSP incompatibility, while the production build remains clean. See QA_EVIDENCE.md.

## Readiness

Goal mode is active. P0-001 and P0-002 are complete; P0-003 and P0-004 are the next independent security slices, while P0-005 remains externally blocked by the missing development secret. The product is not complete or launch-ready.
