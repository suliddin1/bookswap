# QA evidence

Evidence date: 2026-07-14 (Asia/Baku). Repository: D:\Codex Projects\2HandedBook, branch autonomous/bookswap-product, checkpoint base d644ad2b5775ae98386ae96636f23d5f530b0ef1.

No production database, deployment, remote branch, or protected secondary checkout was touched. Public development configuration was supplied only to validation processes; no credential was written to tracked files. Transient server logs and Playwright output are under ignored test-results.

## P1 fail-closed reviewable moderation — current evidence

Applied additive development migration: `add_reviewable_moderation_decisions`. Development now has 15 migrations, 12/12 RLS public tables, 54 constraints, and 43 indexes. The new ledger contains request/actor/target identifiers, surface, content type, provider, outcome, bounded reason/category diagnostics, provider decision ID, and timestamp; raw submitted text and image URLs have no columns and are not retained. Anon/authenticated have no privileges plus an explicit false policy. Service role has SELECT/INSERT only; direct UPDATE/DELETE is grant-denied. Generated types agree with the deployed columns and actor relationship. Schema security lint is empty; performance output is unused-index INFO on the zero-row development dataset.

The moderation adapter has three explicit outcomes: approved, rejected, and unavailable. Without `OPENAI_API_KEY`, normal text/image input returns `PROVIDER_NOT_CONFIGURED`; provider timeout, network failure, non-success status, rate limit, and malformed success bodies also return unavailable. Local marketplace rules may reject known unsafe text without a provider, but can never approve content when the provider is absent. The configured OpenAI adapter validates the response shape and uses the documented multimodal image input for `omni-moderation-latest`; no paid/provider request was made during this unconfigured test slice.

Publishing and messaging fail closed: unavailable becomes Azerbaijani `MODERATION_UNAVAILABLE`/HTTP 503, rejected becomes `CONTENT_REJECTED`/HTTP 422, and an audit-write failure becomes `MODERATION_AUDIT_UNAVAILABLE`/HTTP 503. Listing creation checks final text plus every image; edits check the merged final text and only newly added images. Chat verifies authentication and room membership before provider use. Listing edits verify ownership before provider use. The authenticated preflight route records text/image results and returns 503 if either required check is unavailable. The protected admin dashboard queries and displays the last 50 decisions while explaining that raw content is excluded.

Focused fixtures prove normal unconfigured input is unavailable, the unsafe local fixture is rejected, a valid mocked multimodal response is approved, malformed provider output is unavailable, ledger inserts exclude the submitted string, and ledger-write failure is 503. Live development SQL proved service-role insert/select succeeds while anon SELECT, authenticated INSERT, service-role UPDATE, and service-role DELETE each fail with 42501. The attempted tamper/delete did not change the row; the fixture was then removed as postgres and the ledger returned to zero rows.

Current gate: lint pass; TypeScript pass; Vitest 24/24; Next.js production build 37 routes; Playwright 4/4. Agent Browser production checks at 1440x900, 1024x768, 390x844, and 360x800 show meaningful home content, usable navigation/search controls, no horizontal overflow, no framework overlay, and zero console/page errors. Browser sessions, server, screenshots, and database fixtures were cleaned. Live authenticated Next-route and admin-browser journeys remain honestly blocked by P0-005's missing development service secret; a real configured moderation-provider response was intentionally not claimed.

## P1 unread chat state and durable notifications — current evidence

Applied additive development migration: `add_chat_read_state_and_durable_notifications`. Development now has 14 migrations, 11/11 RLS public tables, 45 constraints, and 40 indexes. `chat_room_reads` is authenticated-SELECT-only, has one owner/member policy and one read-ack trigger, and appears exactly once in `supabase_realtime`. `messages` has one durable delivery trigger. The three private trigger functions are SECURITY DEFINER with `search_path=""` and postgres-only execute. Generated types contain the new table, room activity, and notification message link. Schema security lint is clean; the known Pro-only Auth warning remains; performance output is unused-index INFO on the cleaned dataset.

Room creation initializes buyer/seller count zero. Message insert atomically validates membership, increments only the recipient, advances `last_message_at`, and creates exactly one notification keyed by `message_id`; trigger failure rolls back the message. Read acknowledgement atomically sets count zero/server marker and marks matching message notifications read. Direct clients cannot mutate read state. System notification insertion is awaited, unexpected database errors are 500, and optional email outcome is returned instead of detached.

Live RLS/Realtime/reconnect evidence used three temporary confirmed users, one listing, and one room:

| Probe | Result |
| --- | --- |
| Initial participant state | Buyer and seller each see one own row/count 0; third sees 0 rows. |
| Direct authenticated read-state update | Denied even for owner; mutation is server-managed. |
| Three buyer messages | Seller count 3, buyer count 0, exactly three unique linked notifications. |
| Read-state Realtime | Seller receives `[3]`; buyer and third receive no seller update. |
| Third/spoofed send | RLS denied; no message/count/notification side effect. |
| Privileged nonmember send | Trigger rejects 23514, proving service writes cannot bypass membership. |
| Seller acknowledgement | Count 0, read marker present, all three room notifications read. |
| Seller reconnect/reply | Persisted 0/all-read; reply makes buyer count 1 and one linked notification. |
| Notification ownership | Seller cross-mark affects 0 rows; buyer self-mark affects 1. |
| Cross-device read event | Seller receives notification `read=true` and count `0`; third receives neither. |
| Exact room-list relation query | One room/own read row; buyer/seller keys exactly city/created_at/id/name; listing embed succeeds. |

Production Agent Browser signed in as the temporary buyer on a public page. Desktop navigation exposed `1 unread messages`; mobile exposed `Messages (1)` and `Notifications (1)`. A server acknowledgement changed the live message label 1→0; a seller message changed it 0→1 through protected Postgres Changes. Header/menu scroll width equalled 1440, 1024, 390, and 360 viewports; accessibility names exposed the counts; console/page errors were zero. The protected messages/notifications Next routes remain part of P0-005's external service-secret blocker and were not falsely claimed.

Current gate: lint pass; TypeScript pass; Vitest 17/17; Next.js production build 37 routes; Playwright 4/4. Cleanup counts are zero for temporary Auth users, public users, listing, room, read states, messages, notifications, cleanup jobs, and Storage objects.

## P1 catalog pagination and seller inventory — current evidence

Applied additive development migration: `add_listing_pagination_indexes`. It adds the partial `(price,id)` index for active catalog price traversal and `(seller_id,created_at desc,id desc)` for public active/sold seller inventory. The development catalog now has 13 migrations, 10 RLS-enabled public tables, 40 constraints, and 35 indexes. The security advisor is empty; performance notices are only unused-index INFO on the cleaned development dataset.

Catalog and seller APIs return `{items,nextCursor}` using canonical versioned base64url cursors bound to normalized filters or seller scope. Newest uses `(created_at desc,id desc)`; price-low uses `(price asc,id asc)`; price-high uses `(price desc,id desc)`. Limit+1 detects continuation. Query/category/city/condition/maximum-price/sort are server-side; filter/cursor or catalog/seller scope mismatches return 400. Clients cancel/reset stale first pages, reject stale load-more results, de-duplicate IDs, preserve valid filters in the URL, and normalize malformed deep links.

Live API evidence used two temporary Auth users, five active rows including equal price/timestamp ties, one sold row, one draft, one eligible sold-interaction review, and one concurrent active insert:

| Probe | Result |
| --- | --- |
| Price-low pages | Original IDs in exact `(price,id)` ascending order, once each. |
| Price-high pages | Original IDs in exact `(price,id)` descending order, once each. |
| Newest equal-timestamp tie | Higher ID then lower ID, deterministic. |
| Concurrent newer insert after page one | Original traversal had no gap/duplicate; newer row correctly remained before the cursor. |
| Category/city/condition/max-price composition | Exactly the three eligible fixtures. |
| Cursor reused with different filter/scope | 400 `INVALID_CURSOR`. |
| Public seller response | Safe keys only: city, createdAt, id, initials, name, rating, reviewCount. |
| Seller inventory/rating | Seven active/sold rows exactly once; draft absent; rating 4 from one eligible review. |

The first price-high matrix exposed a secondary-ID direction error that duplicated/omitted tied rows; the implementation was corrected to explicit descending ID order and the entire matrix reran successfully. Agent Browser then observed 200 responses for `/api/listings` and `/api/sellers/[id]`, exact filtered catalog order, seven storefront cards including sold and excluding draft, rating text, exposed names for every catalog filter, no console/page errors, and matching viewport/scroll widths at 1440x900, 1024x768, 390x844, and 360x800.

Current gate: lint pass; TypeScript pass; Vitest 17/17; Next.js production build 37 routes; Playwright 4/4. Cleanup counts are zero for both Auth users, public users, listings, reviews, cleanup jobs, and Storage objects.

## P1 image lifecycle — current evidence

Applied additive development migrations:

1. `add_listing_image_cleanup_jobs`
2. `allow_owner_listing_image_selection`
3. `make_cleanup_jobs_service_only_explicit`
4. `deduplicate_listing_image_cleanup_jobs`

The client now revokes every local preview URL, lets sellers remove staged and existing photos, uploads replacements before mutation, and calls an authenticated compensation endpoint after failed create/edit. The server accepts cleanup only for URLs on the configured Supabase host in the authenticated user's exact first-level folder, refuses traversal/nested/query/fragment paths, rechecks live listing references, and drains through the Storage API. A listing image update/delete trigger persists obsolete URLs transactionally in `listing_image_cleanup_jobs`; the queue records failed attempts and is service-only through grants, RLS, and an explicit false client policy. API responses expose `imageCleanupPending` rather than silently hiding a Storage failure.

Live Storage/RLS evidence used two temporary confirmed Auth users, three valid PNG objects, one oversized payload, and shared/obsolete listing references:

| Probe                                             | Result                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------- |
| Owner uploads into own folder                     | Success.                                                                          |
| Other user uploads into owner folder              | Denied.                                                                           |
| Other user deletes owner object                   | Denied/zero rows; public object still fetched successfully.                       |
| Owner deletes own object/batch                    | Success: exactly 1 and 2 deleted entries.                                         |
| `text/plain` upload                               | Denied by bucket MIME restriction.                                                |
| 5 MB + 1 byte PNG upload                          | Denied by bucket size restriction.                                                |
| Other user inserts listing with spoofed seller    | Denied by listing RLS.                                                            |
| Authenticated cleanup-queue SELECT                | Denied; queue is not client-readable.                                             |
| Replace removes one obsolete URL                  | One durable unreferenced job created.                                             |
| Delete listing while another listing shares a URL | Shared URL job created but detected as still referenced; object remained present. |

The first owner-delete probe exposed that the earlier hardening migration had removed Storage SELECT because public asset delivery bypasses RLS; current Supabase removal still requires SELECT plus DELETE. The additive fix grants authenticated SELECT only for the caller's own folder. The corrected full matrix passed. All temporary Auth users, profiles, listings, cleanup jobs, and Storage objects were removed; every final count is zero.

Schema evidence: twelve migrations; 10/10 public tables with RLS; 40 public constraints; 33 public indexes; three owner-scoped Storage policies. The queue trigger exists once, its function is SECURITY DEFINER with `search_path=""`, anon/authenticated have no table privilege, service role has CRUD, duplicate direct-input URLs queue once, and generated TypeScript matches the new table. The final database security advisor returns no findings; performance output remains only expected empty-project unused-index INFO.

Current local/browser gate: lint pass; TypeScript pass; Vitest 14/14; Next.js production build 37 routes; Playwright 4/4. Agent Browser exercised create-photo selection and removal at 390x844: the preview appeared as one blob image, exposed `Remove selected photo 1`, disappeared after removal, and the captured blob URL was revoked. Create/profile surfaces had matching viewport and scroll widths at 1440x900, 1024x768, 390x844, and 360x800, zero console/page errors, and no upload mutation without a session. Live protected Next route calls remain deferred to P0-005 because the development service secret is unavailable; IMG-02/IMG-03 therefore remain Partial rather than Pass despite the implemented backstop and direct Storage evidence.

## P0 public catalog and chat authorization — current evidence

Applied additive development migrations:

1. `fix_chat_room_seller_authorization`
2. `add_chat_room_listing_seller_index`

The first adds the non-exposed `private.user_is_active(uuid)` predicate, rewrites policies that previously tried to read protected `users.banned`, qualifies chat-room ownership columns, and replaces the single-column room/listing foreign key with `(listing_id, seller_id) -> listings(id, seller_id)`. The second adds the advisor-requested covering index. Generated TypeScript confirms the composite relationship.

Current validation:

| Command / probe                        | Result                                                         |
| -------------------------------------- | -------------------------------------------------------------- |
| `npm run lint`                         | Pass, exit 0, no warnings.                                     |
| `npx tsc --noEmit`                     | Pass, exit 0, no diagnostics.                                  |
| `npm test -- --run`                    | Pass: 1 file, 9/9 tests.                                       |
| `npm run build`                        | Pass: Next.js 15.5.19, 37 generated routes.                    |
| `npm run test:e2e`                     | Pass: Chromium 4/4.                                            |
| Direct safe profile read               | 200; only id/name/city/created_at.                             |
| Direct profile email and `*` reads     | 401 with PostgreSQL 42501.                                     |
| Safe listing/seller embed              | 200; seller keys are exactly city/created_at/id/name.          |
| Attempted private RPC through Data API | 404/PGRST202.                                                  |
| Banned-seller probe                    | Profile rows 0 and public listing rows 0; ban reset afterward. |

Direct authenticated role-level chat probes used three temporary users and one active listing. The valid buyer/listing-owner pair inserted successfully. Wrong seller, spoofed buyer ID, self-room, inactive listing, banned buyer, banned seller, missing listing, anonymous insert, and third-party room read all failed. The actual buyer could read its room. A privileged mismatched insert failed the composite foreign key with 23503. Catalog inspection then confirmed zero mismatched rooms, zero compiled tautologies, one composite chat/listing relationship, and the covering index.

Function catalog evidence: `private.user_is_active` is SECURITY DEFINER, stable, strict, configured with `search_path=""`, and executable only by postgres/anon/authenticated. All nine public tables retain RLS. Security advisor reports one external warning: leaked-password protection is disabled; official Supabase documentation states it is available on Pro and above, so the free development project was not upgraded. Performance advisor has only expected new-project unused-index informational notices; the missing foreign-key index warning is resolved.

Production browser evidence with Agent Browser:

| Viewport | Catalog/detail | Seller fixture | Horizontal overflow      | Console/page errors |
| -------- | -------------- | -------------- | ------------------------ | ------------------- |
| 1440x900 | 200            | Rendered       | None (scroll width 1440) | None                |
| 1024x768 | 200            | Rendered       | None (scroll width 1024) | None                |
| 390x844  | 200            | Rendered       | None (scroll width 390)  | None                |
| 360x800  | 200            | Rendered       | None (scroll width 360)  | None                |

The detail API returned 200 and rendered the safe seller name/city at 390x844. Accessibility-tree inspection also found empty accessible names on the catalog search, location, and condition controls; this remains P1-011. A `next dev` run records a React Refresh `unsafe-eval` CSP violation, but a fresh production browser session has zero errors; this remains in P2-005 rather than weakening the production CSP.

Cleanup: all three temporary Auth users were deleted. Cascades were verified: temporary Auth users 0, public profiles 0, listings 0, and chat rooms 0.

## P0 favorite visibility — current evidence

Applied additive development migrations:

1. `secure_favorite_listing_visibility`
2. `restrict_banned_user_favorite_access`

The route now filters privileged favorites through explicit inner relationships, active/sold state, and active seller status; revalidates every nested result before serialization; validates targets before upsert; maps an atomic trigger race to `LISTING_UNAVAILABLE`; and reports unexpected database faults as 500 instead of 401. The database adds a private visibility predicate, a service-role-resistant before-write trigger, and requester/ban/target-aware RLS. Book-card browser verification also raised the heart control above the cover title and made its accessible name reflect save/remove state.

| Probe                            | Result                                                              |
| -------------------------------- | ------------------------------------------------------------------- |
| Buyer direct RLS SELECT          | Exactly active and sold listing IDs; transitioned draft absent.     |
| Other-user SELECT                | Exactly the other user's active favorite; buyer favorites absent.   |
| Valid active insert              | Success.                                                            |
| Draft / locked insert            | 23514 from the atomic target trigger.                               |
| Spoofed `user_id` insert         | 42501 RLS denial.                                                   |
| Anonymous insert                 | 42501 table permission denial.                                      |
| Banned seller                    | Buyer SELECT returns 0; new save fails 23514.                       |
| Banned buyer                     | SELECT returns 0; new save fails 42501.                             |
| Authenticated Data API safe join | 200; only active/sold; seller keys exactly city/created_at/id/name. |
| Draft insert through Data API    | 400 with code 23514.                                                |
| Listing deletion                 | Zero orphan favorite rows after cascade.                            |

Catalog inspection confirms `favorite_listing_is_visible` is stable, strict, SECURITY DEFINER, `search_path=""`, and executable only by postgres/authenticated. The trigger function is SECURITY DEFINER with `search_path=""` and postgres-only execute ACL; its trigger is enabled. The three favorite policies compile with requester, active-user, and target-visibility predicates. Generated TypeScript remains compatible and exposes no private helper. Security advisor remains at the single previously documented Pro-only Auth warning; performance advisor has only expected unused-index informational entries.

Current command/browser gate: lint pass; TypeScript pass; Vitest 10/10; production build 37 routes; Playwright 4/4. At 390x844 the signed-out favorites page has scroll width 390, renders its sign-in state, and logs no console/page error. The corrected catalog save control is clickable and redirects to `/login`; no `/api/favorites` request is sent without a session. The development service secret is still unavailable, so a live protected Next route call is explicitly deferred to P0-005; the database trigger ensures privileged writes cannot bypass the target invariant meanwhile.

Cleanup: three temporary Auth users, their profiles, seven temporary listings, and all temporary favorite rows were removed; all verification counts are zero.

## P0 protected message delivery — current evidence

No migration was required. The active client already used `postgres_changes` on `public.messages`, and official Supabase documentation confirms records from RLS-enabled tables are delivered only when the subscriber may SELECT them. The unauthorised public Broadcast send and dormant Broadcast listener were removed; both clients now use only the published table stream and de-duplicate IDs.

Direct role-level matrix:

| Probe                                  | Result                         |
| -------------------------------------- | ------------------------------ |
| Buyer INSERT as own sender in own room | Success.                       |
| Seller SELECT in the room              | 1 visible message.             |
| Third-user SELECT                      | 0 visible messages.            |
| Third-user INSERT                      | 42501 RLS denial.              |
| Buyer spoofing seller sender ID        | 42501 RLS denial.              |
| Banned buyer INSERT                    | 42501 RLS denial.              |
| Anonymous SELECT                       | 42501 table permission denial. |

Live Realtime evidence used independent authenticated Supabase clients with explicit Realtime access tokens. A buyer insert produced the matching Postgres Changes event for the buyer and seller subscriptions; an already-subscribed third user received zero events. Catalog inspection confirms `public.messages` appears exactly once in `supabase_realtime`, RLS is enabled, and the member SELECT plus active-member INSERT policies are deployed. A source-contract unit test rejects `.channel()`/Broadcast in the send route and requires `postgres_changes` in both chat clients.

Current gate: lint pass; TypeScript pass; Vitest 11/11; Next.js production build 37 routes; Playwright 4/4. Agent Browser rendered the signed-out messages state at 1440x900, 1024x768, 390x844, and 360x800 with matching viewport/scroll widths, no `/api/chat` request, and zero console/page errors. Security advisor remains at the single Pro-only Auth warning; performance advisor remains informational only.

Cleanup: the three temporary Auth users and cascaded profiles, listing, room, and messages were removed; every verification count is zero.

## Static and automated baseline

| Command                              | Result                    | Exact summary                                                                                                                |
| ------------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| npm run lint                         | Pass, exit 0              | ESLint over .js/.ts/.tsx with max-warnings=0; no warnings/output.                                                            |
| npx tsc --noEmit                     | Pass, exit 0              | No TypeScript diagnostics.                                                                                                   |
| npm test                             | Pass, exit 0              | Vitest: 1 file passed, 24 tests passed.                                                                                       |
| npm run build                        | Pass, exit 0              | Next.js 15.5.19 compiled in 5.7 s; lint/type/page data passed; 37/37 static pages generated.                                 |
| npm run test:e2e                     | Pass, exit 0              | Playwright Chromium: 4 tests passed in 2.1 s (browse home/catalog, mobile navigation, safety/user-rights, security headers). |

Production build route evidence:

- 37 route entries generated.
- Shared first-load JavaScript: 102 kB.
- Home: 212 kB first load.
- Catalog: 211 kB.
- Listing detail: 217 kB.
- Favorites: 208 kB.
- Build success does not override runtime API failures below.

## Historical pre-fix four-viewport browser inspection (superseded)

This section preserves the preparation baseline that motivated P0-001. It is superseded by the current evidence above.

The production server was started with the new development project's public URL/publishable key in process environment. At each viewport the script loaded home and catalog to network idle, checked document text/navigation/overflow, captured console/request/HTTP failures, and called /api/listings directly.

| Viewport | Home | Catalog page | Meaningful content/nav | Horizontal overflow | /api/listings | Console/network                                                                             |
| -------- | ---- | ------------ | ---------------------- | ------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| 1440x900 | 200  | 200          | Pass                   | None                | 500           | Two 500 resource errors; catalog navigation RSC request aborted during scripted transition. |
| 1024x768 | 200  | 200          | Pass                   | None                | 500           | Same.                                                                                       |
| 390x844  | 200  | 200          | Pass                   | None                | 500           | Same.                                                                                       |
| 360x800  | 200  | 200          | Pass                   | None                | 500           | Same.                                                                                       |

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
5. fix_chat_room_seller_authorization
6. add_chat_room_listing_seller_index

Catalog verification:

- 9 public tables, all RLS enabled: users, listings, chat_rooms, messages, reviews, notifications, favorites, reports, privacy_requests.
- 37 public constraints, including the composite chat-room listing/seller foreign key and referenced unique key.
- 30 public indexes including full-text/trigram/filter/listing cursor support, relationship indexes, uniqueness, open-case partial indexes, and the composite chat ownership index.
- Policy counts: users 2; listings 4; chat_rooms 2; messages 2; reviews 2; notifications 2; favorites 3; reports 2; privacy_requests 2; storage.objects 2.
- Grants verified: anon cannot select users.email or users.is_admin; authenticated can update users.phone but not users.email; anon cannot select chat_rooms; authenticated can update notifications.read but not notifications.payload.
- Storage bucket listing-images is public for reads, limited to 5,242,880 bytes, and limited to image/jpeg, image/png, image/webp. Insert/delete policies require the authenticated user ID as the first object path segment.
- supabase_realtime publication contains public.messages and public.notifications.
- on_auth_user_created fires after Auth inserts and calls handle_new_user.
- handle_new_user is SECURITY DEFINER, has empty search_path, and execute ACL only for postgres/service_role.
- TypeScript generation succeeded and contains the same 9 tables and 2 enums as the repository's hand-shaped lib/database.types.ts. The generated file was not written over application code during preparation.
- Supabase security advisor: one external leaked-password protection warning, a Pro-and-above feature on the current free development plan.
- Performance advisor: informational unused-index notices only, expected for a zero-row new project; re-evaluate with representative traffic.

Functional Auth profile evidence:

1. Inserted one temporary development Auth user with a unique audit UUID and safe name metadata.
2. Confirmed public.users contained the same ID/name/email with banned=false and is_admin=false.
3. Deleted the Auth user.
4. Confirmed zero matching public profile rows remained.

No audit test data remains.

## Historical backend defects resolved by this slice

### Chat-room seller authorization

Catalog inspection of the deployed policy returned:

    listing.seller_id = listing.seller_id

The migration source intended listing.seller_id = seller_id, but SQL name resolution bound the unqualified inner reference to the listing relation. The new qualified policy plus composite foreign key resolves this defect; the compiled tautology count is now zero.

### Public profile/API compatibility

Safe column grants existed, but the listing RLS policy itself tried to read protected `users.banned`, causing PostgREST 42501. Moving that predicate behind the private security-definer function restores the existing explicit safe-column embed without widening grants. Current catalog/detail reads return 200.

## Coverage limits

- No service-role/secret key for the new development project is available through the connected tooling or local environment, so protected Next.js route flows were not exercised live.
- Existing E2E tests are signed-out smoke tests and do not cover buyer/seller/admin isolation, RLS adversarial cases, uploads, message membership, unread state, or moderation.
- Only a minimal temporary authorization listing was seeded and removed; search relevance, pagination, query plans, and realistic performance remain unverified.
- Accessibility evidence is foundation/source inspection plus responsive checks, not a complete WCAG audit.
- Deployment, production secrets/domain, monitoring, backups, rollback, and legal operator configuration remain unverified.
