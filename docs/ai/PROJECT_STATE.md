# Project state

Snapshot date: 2026-07-14.

## Repository protection

- Active and only authorized repository: D:\Codex Projects\2HandedBook.
- Protected out-of-scope checkout: D:\GitHub\BookSwap.
- Branch: autonomous/bookswap-product.
- Checkpoint: d644ad2b5775ae98386ae96636f23d5f530b0ef1, chore: checkpoint existing BookSwap development state.
- Checkpoint captured 86 legitimate files (5,497 insertions, 452 deletions) after ignored/untracked/secret/whitespace review.
- Remote: origin points to https://github.com/suliddin1/bookswap.git. Nothing was pushed.
- Before guidance creation the tree was clean; current preparation changes are documentation only.

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
- Repository migrations applied in order: init, marketplace_upgrade, production_hardening, security_marketplace_hardening.
- Verified: 9 RLS-enabled public tables; 36 constraints; 28 indexes; 21 public-table policies plus 2 Storage policies; column grants protecting private profile/admin fields; listing-images bucket (public read, 5 MB, JPEG/PNG/WebP); messages and notifications Realtime publication; restricted security-definer Auth trigger; schema-derived TypeScript generation; zero Supabase security advisor findings.
- Functional Auth test passed: a temporary Auth user created one safe profile and deletion cascaded; no test row remains.
- Performance advisor reports only expected unused-index informational findings on an empty new database; do not remove indexes until representative query evidence exists.

## Compatibility and blockers

The backend schema matches the repository migrations and generated type shape, but the current application is not fully compatible through PostgREST:

1. Public catalog requests embed seller:users after the migrations revoke table-level users SELECT and grant safe columns only. PostgREST returns 42501 permission denied for table users, so /api/listings returns 500 at all viewports.
2. The chat-room insert policy contains an ambiguous seller_id reference. PostgreSQL compiles the intended owner comparison to listing.seller_id = listing.seller_id, allowing a buyer to associate an active listing with an arbitrary existing seller.
3. Favorite retrieval uses service role without restricting joined listings to public state.
4. Chat message code emits an additional room broadcast without private-channel authorization.
5. The connector provides public project configuration but not a service-role/secret key. Full protected-route browser verification therefore remains externally blocked until a development secret is configured locally outside Git.

## Baseline

Passed: lint, TypeScript, 9/9 unit tests, production build (37 generated routes), and 4/4 existing Playwright tests. Four-viewport rendering returns 200 with meaningful content and no horizontal overflow, but catalog API requests return 500 and create console errors. See QA_EVIDENCE.md.

## Readiness

The repository is prepared to begin Goal mode: work is checkpointed, the autonomous branch and non-production backend exist, product scope/decisions/evidence/acceptance/queue are durable. The product itself is not complete or launch-ready; Goal mode must begin with P0 security and catalog compatibility issues.
