# QA evidence

Evidence date: 2026-07-14 (Asia/Baku). Repository: D:\Codex Projects\2HandedBook, branch autonomous/bookswap-product, checkpoint base d644ad2b5775ae98386ae96636f23d5f530b0ef1.

No production database, deployment, remote branch, or protected secondary checkout was touched. Public development configuration was supplied only to validation processes; no credential was written to tracked files. Transient server logs and Playwright output are under ignored test-results.

## Static and automated baseline

| Command | Result | Exact summary |
| --- | --- | --- |
| npm run lint | Pass, exit 0, about 4 s | ESLint over .js/.ts/.tsx with max-warnings=0; no warnings/output. |
| npx tsc --noEmit --incremental false | Pass, exit 0, about 5.7 s | No TypeScript diagnostics. |
| npm test | Pass, exit 0, about 2.3 s | Vitest: 1 file passed, 9 tests passed; test duration 811 ms. |
| npm run build | Pass, exit 0, 21.5 s | Next.js 15.5.19 compiled in 3.3 s; lint/type/page data passed; 37/37 static pages generated. |
| npm run test:e2e | Pass, exit 0, 4.1 s | Playwright Chromium: 4 tests passed in 2.0 s (browse home/catalog, mobile navigation, safety/user-rights, security headers). |

Production build route evidence:

- 37 route entries generated.
- Shared first-load JavaScript: 102 kB.
- Home: 211 kB first load.
- Catalog: 210 kB.
- Listing detail: 217 kB.
- Favorites: 208 kB.
- Build success does not override runtime API failures below.

## Four-viewport browser inspection

The production server was started with the new development project's public URL/publishable key in process environment. At each viewport the script loaded home and catalog to network idle, checked document text/navigation/overflow, captured console/request/HTTP failures, and called /api/listings directly.

| Viewport | Home | Catalog page | Meaningful content/nav | Horizontal overflow | /api/listings | Console/network |
| --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | 200 | 200 | Pass | None | 500 | Two 500 resource errors; catalog navigation RSC request aborted during scripted transition. |
| 1024x768 | 200 | 200 | Pass | None | 500 | Same. |
| 390x844 | 200 | 200 | Pass | None | 500 | Same. |
| 360x800 | 200 | 200 | Pass | None | 500 | Same. |

Rendered title: “BookSwap | Give books a second life”. The existing Playwright mobile navigation test passes. The catalog surface renders its error/empty vocabulary and therefore still contains meaningful text, but the core listing flow fails and is not accepted.

Server-side error captured from the real API:

    code: 42501
    message: permission denied for table users
    hint: Grant the required privileges to the current role with: GRANT SELECT ON public.users TO anon;

Do not follow that hint literally: granting the entire users table would expose email/phone/admin/ban fields. P0-001 requires a safe public profile contract.

## Development backend verification

Target: bookswap-development, ref uibatsbzjswmtdvdrlxj, eu-central-1, ACTIVE_HEALTHY, PostgreSQL 17. The authorized organization was on the free plan and the connector reported zero monthly project cost.

Applied migrations in repository order:

1. init
2. marketplace_upgrade
3. production_hardening
4. security_marketplace_hardening

Catalog verification:

- 9 public tables, all RLS enabled: users, listings, chat_rooms, messages, reviews, notifications, favorites, reports, privacy_requests.
- 36 public constraints: 10 checks, 15 foreign keys, 2 explicit unique constraints, plus primary keys/remaining constraints.
- 28 public indexes including full-text/trigram/filter/listing cursor support, relationship indexes, uniqueness, and open-case partial indexes.
- Policy counts: users 2; listings 4; chat_rooms 2; messages 2; reviews 2; notifications 2; favorites 3; reports 2; privacy_requests 2; storage.objects 2.
- Grants verified: anon cannot select users.email or users.is_admin; authenticated can update users.phone but not users.email; anon cannot select chat_rooms; authenticated can update notifications.read but not notifications.payload.
- Storage bucket listing-images is public for reads, limited to 5,242,880 bytes, and limited to image/jpeg, image/png, image/webp. Insert/delete policies require the authenticated user ID as the first object path segment.
- supabase_realtime publication contains public.messages and public.notifications.
- on_auth_user_created fires after Auth inserts and calls handle_new_user.
- handle_new_user is SECURITY DEFINER, has empty search_path, and execute ACL only for postgres/service_role.
- TypeScript generation succeeded and contains the same 9 tables and 2 enums as the repository's hand-shaped lib/database.types.ts. The generated file was not written over application code during preparation.
- Supabase security advisor: zero findings.
- Performance advisor: informational unused-index notices only, expected for a zero-row new project; re-evaluate with representative traffic.

Functional Auth profile evidence:

1. Inserted one temporary development Auth user with a unique audit UUID and safe name metadata.
2. Confirmed public.users contained the same ID/name/email with banned=false and is_admin=false.
3. Deleted the Auth user.
4. Confirmed zero matching public profile rows remained.

No audit test data remains.

## Verified backend defects

### Chat-room seller authorization

Catalog inspection of the deployed policy returned:

    listing.seller_id = listing.seller_id

The migration source intended listing.seller_id = seller_id, but SQL name resolution binds the unqualified inner reference to the listing relation. This is a tautology and fails CHAT-01/DB-01.

### Public profile/API compatibility

Safe column grants exist, but the PostgREST embedded relation used by app/api/listings/route.ts requires table-level access and returns 42501. The schema is present; application compatibility fails at the real API boundary.

## Coverage limits

- No service-role/secret key for the new development project is available through the connected tooling or local environment, so protected Next.js route flows were not exercised live.
- Existing E2E tests are signed-out smoke tests and do not cover buyer/seller/admin isolation, RLS adversarial cases, uploads, message membership, unread state, or moderation.
- No representative listing dataset was seeded; search relevance, pagination, query plans, and realistic performance remain unverified.
- Accessibility evidence is foundation/source inspection plus responsive checks, not a complete WCAG audit.
- Deployment, production secrets/domain, monitoring, backups, rollback, and legal operator configuration remain unverified.
