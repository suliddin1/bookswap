# Iteration log

## 2026-07-14 - P1 Azerbaijani public listing and seller journeys

Goal / acceptance IDs: P1-010; L10N-01, PROF-02, LIST-01, FAV-01, REV-01, REP-01, SEO-01, RESP-01, A11Y-01, TEST-01.

Ownership: root exclusively owns the Azerbaijani contract additions, listing-detail/public-seller/favorites route metadata and components, their safe client error mapping and focused tests, browser fixtures/evidence, and affected durable documentation for this slice. No other agent is editing these files.

Starting state: clean branch `autonomous/bookswap-product` at `332aca1`. The public-discovery foundation is Azerbaijani, but listing detail, seller storefront, and favorites still expose English headings, states, accessible names, prices, locations, categories, dates, review/report/trust copy, generic metadata, and raw server/auth errors. The seller route metadata is English; listing and favorites lack route metadata.

Planned contract: extend the typed copy contract across all three journeys; keep user-entered text and English API/query codes unchanged; map displayed marketplace values and safe action error codes; make money/date formatting deterministic; add honest Azerbaijani route metadata without inventing canonical/production facts; prove active/sold/review/report/storefront/favorites states, accessible names, loading/error/empty behavior, responsive reflow, no English leaks/mojibake/hydration/runtime errors, full repository gates, and fixture cleanup.

Implemented: extended the typed copy and safe API-code mapping through listing detail, public seller inventory, reviews, reports, trust guidance, and favorites. Marketplace codes remain stable while displayed category/condition/city/status values are localized; user-entered titles, authors, descriptions, and reviews remain unchanged. Listing and seller routes now publish Azerbaijani metadata plus per-ID canonical URLs, while private favorites is Azerbaijani and explicitly `noindex,nofollow`. Signed-out favorites no longer sends a protected request or exposes an English Auth error. Top-level unavailable/auth states render one semantic `h1`. Number and date helpers now use deterministic Azerbaijani decimal/group separators, month names, and the Asia/Baku calendar boundary rather than runtime-dependent ICU output.

Adversarial review: `next dev` could not hydrate under the production CSP because React Refresh requires `unsafe-eval`; the policy was not weakened, and all representative verification used the optimized production runtime. The first production matrix then exposed two real browser-only localization defects: `17.5 ₼` instead of `17,5 ₼`, and `M07` instead of `iyul`. Explicit formatting fixed both. Generic listing/seller metadata is intentionally truthful but not content-derived; dynamic titles/descriptions/Open Graph images and sitemap discovery remain SEO work. A signed-out visitor can exercise review/report validation without a mutation; full authenticated favorites/report/review route execution remains attached to P0-005's missing development service secret and is not claimed here.

Validation: lint, strict TypeScript, 30/30 unit tests, the 37-route production build, and 5/5 Playwright tests pass. Two temporary development Auth profiles, active/sold listings, one completed room, and one review drove real public APIs and production pages without browser mocks. Listing detail, sold/review state, seller aggregate/inventory, and signed-out favorites passed at 1440x900, 1024x768, 390x844, and 360x800 with correct `lang=az`, one `h1`, mapped labels, comma-decimal manat values, `iyul 2026`, per-ID canonicals, favorites `noindex`, zero missing/old copy, overflow, mojibake, console/page/request failures, or HTTP 4xx/5xx. Visual inspection passed for one representative page at each viewport class.

Cleanup: no report, review, favorite, or message mutation was submitted in-browser. Auth sessions and refresh tokens were removed before identity/Auth deletion. Cascades removed both public profiles, both listings, the room, read state, and review; verification returned zero remnants in every touched Auth/public table. Production/dev servers, screenshots, and logs were removed. Ownership for this slice is released by the local checkpoint.

Next slice: translate listing create/edit plus authentication/password-reset journeys and their validation, upload/moderation, loading, success, and error states. P0-005 remains the sole externally blocked P0.

## 2026-07-14 - P1 Azerbaijani public discovery foundation

Goal / acceptance IDs: P1-010; L10N-01, SEO-01, RESP-01, A11Y-01, TEST-01.

Ownership: root exclusively owns the locale/copy contract, root metadata/manifest, global states, shared shell, home/catalog/card/cover discovery surfaces, listing normalization fallback labels, discovery hook errors, localization inventory, focused tests, and affected durable evidence for this slice. No other agent is editing these files.

Starting state: clean branch `autonomous/bookswap-product` at `d10a020`. The document declares `lang=en`; root metadata, manifest, header/footer, global states, home, catalog, book cards, accessible names, money, dates, categories, conditions, and Azerbaijani locations are predominantly English or inconsistently formatted. English database/query values are already public API contracts, so translating stored values would be a destructive compatibility change.

Planned contract: establish one typed Azerbaijani copy and formatting module; set the document/metadata/manifest locale; load Latin Extended glyphs; translate the complete signed-out home-to-catalog journey and shared shell/states; present stable internal category/condition/city/status codes through Azerbaijani labels; format AZN and dates through `az-AZ`; inventory every remaining UI/API/legal/email surface; prove language, query preservation, accessible names, reflow, metadata, unit/build/E2E behavior, and absence of mojibake or English leaks on the owned journey. Legal operator/contact facts remain blocked rather than fabricated.

Implemented: added the typed `az`/`az-AZ` copy, label, number, and date contract plus a durable surface inventory. Root document/base/social metadata and manifest are Azerbaijani, declare the correct locale/direction, and load Fraunces/Manrope Latin Extended glyphs. Header/footer/global states and the complete home-to-catalog journey use natural Azerbaijani copy and accessible names. Cards and catalog options map stable English category/condition/city/status codes only at presentation time; raw `category=Fiction` remains in the URL/API. Money uses localized numbers plus an explicit non-breaking-space `₼` symbol.

Adversarial review: the first production browser matrix exposed React hydration error 418. Node's ICU rendered `Intl` currency style as `200 ₼`, while Chromium rendered `200 AZN`; the catalog slider therefore differed across server/client. Replacing currency-style output with locale-number formatting plus an explicit symbol removed the mismatch. An isolated repeat showed zero hydration/page/console/HTTP errors. One duplicate Next RSC link prefetch is cancelled with `ERR_ABORTED` on home without a failed response or console effect; direct catalog loads are clean and this is framework request de-duplication rather than an application failure. A transient first-run Supabase DNS failure was retried, then all development reads returned without 4xx/5xx.

Validation: lint, TypeScript, 30/30 unit tests, the 37-route production build, and 4/4 Playwright tests pass. Production home/catalog at 1440x900, 1024x768, 390x844, and 360x800 show `lang=az`, correct title/description, loaded Latin Extended fonts, preserved query codes, selected localized filters, `200 ₼-dək`, Azerbaijani accessible mobile navigation, no old owned-surface English copy, zero overflow/mojibake/overlay/page/console/HTTP errors, and clean mobile scroll-triggered decorative covers. Server, browser, screenshots, and logs were removed; no backend data was changed. P1-010 remains Partial because the inventory names substantial untranslated launch surfaces. Ownership for this slice is released by the local checkpoint.

Next slice: translate listing detail, public seller, and favorites journeys through the same contract, including metadata, review/report/trust/status/price/date/location/error/empty states and four-viewport evidence. P0-005 remains externally blocked by the unavailable development server secret.

## 2026-07-14 - P0 listing reactivation moderation bypass

Goal / acceptance IDs: P0-006; MOD-01, LIST-01, SVC-01, DB-01, TEST-01.

Ownership: root exclusively owns the protected listing mutation routes, listing input/state contracts, listing grants/policies migration and generated types if required, focused tests, affected listing/profile UI, and durable evidence for this slice. No other agent is editing these files.

Starting state: clean branch `autonomous/bookswap-product` at `456321b`. The final P1-009 adversarial review found that a seller can PATCH only `{status:"active"}` on a draft or administrator-rejected listing. Because the edit route moderates only changed text and newly added images, this transition performs zero moderation checks and succeeds even when the provider is unavailable. Authenticated Data API INSERT/UPDATE/DELETE grants also let a direct client bypass protected server moderation entirely. This contradicts the fail-closed publication contract and is stop-ship.

Planned contract: inventory every listing write consumer; make every transition into public `active` state review the final text and every final image; keep unchanged draft edits from doing unnecessary publication checks; remove direct authenticated listing mutations while retaining RLS as defense in depth; prove server/service behavior, direct-role denial, no partial state change, generated compatibility, full repository gates, and affected four-viewport browser behavior.

Implemented: added a pure listing-update moderation planner and wired it into the protected edit route. Draft/sold-to-active transitions review final title/description plus all final images; active edits review changed text/new images only; locked targets fail before provider work. The additive `require_protected_listing_mutations` migration revokes browser-role INSERT/UPDATE/DELETE on listings while keeping SELECT and explicitly grants service-role CRUD. All application listing writes were traced to protected `/api/listings` routes; no browser consumer depended on direct table mutation.

Live evidence: development now has 17 migrations, 13/13 RLS public tables, 61 constraints, and 47 indexes. Catalog privileges show anon/authenticated SELECT=true and INSERT/UPDATE/DELETE=false, while service role has all four. Functional authenticated insert/update/delete statements each fail 42501; a rollback-only service insert/update/delete succeeds. Generated types remain compatible, schema security advisors are empty, and performance notices are zero-data unused-index INFO only.

Validation: lint, TypeScript, 28/28 unit tests, the 37-route production build, and 4/4 Playwright tests pass. One temporary confirmed development Auth user signed in through the real product login form; Auth `/user` returned 200. With only `/api/profile` represented in-browser, the production dashboard exposed active/sold transition controls at 1440x900, 1024x768, 390x844, and 360x800 with matching widths, no overlay/errors/HTTP failures, and 79x34 mobile targets. No mutation was submitted and the profile mock was not backend evidence. The browser session/server/artifacts were removed; Auth sessions were revoked before user deletion; Auth/identity/profile and all other fixture counts are zero. P0-006 and ownership are released by this local checkpoint.

Next slice: P1-010 Azerbaijani-first localization is again the highest independent ready work. P0-005 remains the sole P0 and requires the external development server secret.

## 2026-07-14 - P1 transactional immutable administrator actions

Goal / acceptance IDs: P1-009; ADMIN-01, ADMIN-02, REP-01, DB-01, DB-02, TEST-01.

Ownership: root exclusively owns the additive administrator-audit migration/types, administrator action/dashboard routes, action-error mapping, notification split, admin panel, focused tests, and durable evidence. No other agent edited these files.

Starting state: clean branch `autonomous/bookswap-product` at `232f56e`. Administrator mutations perform direct service-role updates, accept no reason, create no durable human-action history, and are not atomic with notification/audit side effects. The dashboard ignores database errors for listings, users, reports, and privacy requests. The development service secret remains unavailable, so protected Next-route execution must not be fabricated.

Planned contract: an RLS-enabled append-only human-action ledger separate from automated moderation; service-read-only table grants; service-execute-only security-definer RPCs with empty search paths and database-derived active-admin checks; bounded reasons and target transition guards; target mutation, required notification, and audit insertion in one transaction; safe error mapping; dashboard failure surfacing; action/reason/history UI; live action, rollback, grant, tamper, type, build, and four-viewport browser evidence.

Implemented: `add_transactional_admin_audit` adds the ledger, immutable update/delete trigger, private actor/reason guards, and four RPCs for ban/unban, listing approve/reject, report resolution/dismissal, and privacy/appeal transitions. Routes require a 10-1000 character reason and no longer directly mutate targets. Listing moderation atomically creates its SYSTEM notification; optional email is attempted separately. The dashboard checks every query and returns the latest 100 human actions separately from automated decisions. The admin UI exposes a labelled reason field, busy/error status, reason-gated actions, and actor/target/action/reason/before/after/timestamp history.

Live evidence: eight rollback-only actions produced the exact expected history and state, including distinct privacy and appeal actions and two atomic listing notifications. Injected audit failure rolled back the preceding ban. Self/admin/missing/no-op/short-reason/banned-actor/repeated/final-state cases failed without side effects. Anon/authenticated ledger reads, service insert/update/delete, and authenticated RPC calls are denied; service SELECT succeeds. Owner update/delete attempts raise 55000. Function ACL/search-path/owner inspection, generated types, migration history, and advisors pass. Development has 16 migrations, 13/13 RLS public tables, 61 constraints, and 47 indexes; final Auth/public/Storage fixture counts are all zero.

Validation: lint, TypeScript, 26/26 unit tests, the 37-route production build, and 4/4 Playwright tests pass. Agent Browser rendered the production admin UI with a representative browser-only dashboard response at 1440x900, 1024x768, 390x844, and 360x800: immutable history and reason gating are visible, controls have accessible names/help and at least 32x32 targets, widths match, and console/page errors/overlays are zero. No mutation was sent, and this mock was not treated as backend proof. P0-005 still blocks the real authenticated Next admin route. P1-009/ADMIN-02 and ownership are released by this local checkpoint.

Next slice: P1-010 Azerbaijani-first localization is the highest independent ready area. Start with the document language, centralized locale/formatting contract, shell/navigation, shared state/error vocabulary, and a complete user-visible string inventory; legal identity placeholders remain blocked rather than fabricated.

## 2026-07-14 — P1 fail-closed reviewable moderation

Goal / acceptance IDs: P1-008; MOD-01, DB-01, TEST-01.

Ownership: root exclusively owns the typed moderation adapter, listing/chat/preflight integrations, content-minimized moderation ledger migration/types, protected admin review surface, focused tests, and durable evidence. No other agent edited these files.

Starting state: clean branch `autonomous/bookswap-product` at `fa222b7`. Missing text/image provider credentials return successful “Demo ... passed” values. The configured Cloudflare image classifier ignores its result and always passes. Listing and chat mutations accept the boolean contract, call moderation before some ownership/authentication checks, and persist no reviewable outcome. The development service secret and a production-approved provider remain unavailable.

Planned contract: explicit approved/rejected/unavailable outcomes; missing/failed/timed-out/rate-limited/malformed providers never approve; local rules may reject but not approve without a provider; ownership/membership before provider spend; required listing text/new images and chat text fail closed; every outcome written to a raw-content-free service-append-only ledger before mutation; protected admin review; normal/unsafe/malformed/audit-failure, grant, tamper, type, build, and browser evidence.

Implemented: replaced both demo paths with a validated OpenAI Moderations adapter for configured text/multimodal-image checks and explicit unavailable reasons otherwise. Azerbaijani API errors map unavailable to 503, rejection to 422, and ledger-write failure to 503. Listing creation checks final text and every image; edit checks merged final text/new images after ownership; chat checks membership first; authenticated preflight records both requested types. `moderation_decisions` stores bounded identifiers and diagnostics but no submitted text/image URL, enables RLS, denies direct users, and grants service role SELECT/INSERT only. The admin dashboard reviews the latest 50 outcomes and explains the content-minimization boundary.

Live evidence: development has 15 migrations, 12/12 RLS public tables, 54 constraints, and 43 indexes. Service-role insert/select succeeds; anon SELECT, authenticated INSERT, service-role UPDATE, and service-role DELETE each fail 42501. Denied tamper/delete attempts leave the fixture unchanged; postgres cleanup returns the ledger to zero. Generated types match. Schema security lint is empty; performance notices are unused-index INFO only. No real provider or paid request was made and no provider credential was written.

Validation: lint, TypeScript, 24/24 unit tests, 37-route production build, and 4/4 Playwright pass. Unit fixtures cover normal missing-provider unavailable, local unsafe rejection, valid multimodal approval parsing, malformed/failed/rate-limited/unreachable/timed-out provider outcomes, content exclusion, and audit-write failure. Agent Browser at 1440x900, 1024x768, 390x844, and 360x800 shows meaningful content, usable navigation/search, no horizontal overflow, no framework overlay, and zero console/page errors. Browser sessions, screenshots, server, and database fixtures are cleaned. P1-008/MOD-01 and ownership are released by this local checkpoint; authenticated route/admin-browser execution remains honestly attached to P0-005's missing development secret.

Next slice: P1-009 immutable admin action history is the highest independent ready trust/safety gap. It must use transactional database operations rather than reusing the automated moderation ledger.

## 2026-07-14 — P1 unread chat state and durable notifications

Goal / acceptance IDs: P1-007; CHAT-03, NOTIF-01, DB-01, TEST-01, A11Y-01.

Ownership: root exclusively owns the additive chat read-state/notification migration, generated public types, chat room/message/notification routes and helpers, unread Realtime hooks, header/messages/chat/notification UI, focused tests, and durable evidence. No other agent is editing these files.

Starting state: clean branch `autonomous/bookswap-product` at `cdaec26`. Messages are protected by membership RLS and Postgres Changes, but rooms have no participant read marker or unread count. The messages list/header expose no unread state. Message notifications are launched with `void notifyUser`, so a serverless request may finish before the in-app insert and failures are only logged. Notification Realtime listens only for inserts, so read changes do not reconcile across devices.

Planned contract: one service-maintained, RLS-readable participant state per room; database-atomic recipient unread increment plus uniquely message-linked in-app notification; room activity ordering; read acknowledgement that atomically clears matching message notifications; protected Postgres Changes for cross-device counts; awaited system notification insertion with explicit optional-email outcome; visible accessible badges/status; owner/other/third-user, reconnect, failure, and cleanup evidence.

Implemented: `add_chat_read_state_and_durable_notifications` adds `chat_room_reads`, room activity ordering, unique message links on notifications, five supporting indexes, three restricted private trigger functions, one owner-only SELECT policy, and protected Realtime publication. Room creation initializes both participants. Every message transaction validates membership even for privileged writes, increments only the recipient, advances room activity, and inserts exactly one linked in-app notification; notification failure therefore aborts the message. Setting the service-managed recipient count to zero atomically writes a read marker and marks that room's message notifications read. Direct clients can only SELECT their own state. Room APIs expose/clear counts, hooks reconcile INSERT/UPDATE events and reconnect state, chat acknowledges only visible/focused messages, and header/messages/notification UI exposes accessible counts and failures. System notification insertion is awaited; optional email outcome is returned rather than detached.

Live evidence: three temporary authenticated users and one room proved buyer/seller each see exactly their own read row while the third user sees zero; authenticated read-state mutation is denied. Three buyer messages produced seller count three, buyer count zero, three unique message-linked notifications, and a seller-only Realtime update. Third-user and spoofed-sender inserts fail RLS; a privileged nonmember insert independently fails the database trigger with 23514. Server acknowledgement persisted seller count zero/read marker and atomically marked all three notifications read. On reconnect the seller observed zero/all-read; its reply incremented only the buyer and delivered a buyer-only Realtime update/linked notification. Seller cross-account notification marking updated zero rows while buyer self-mark updated one. A second live acknowledgement delivered notification UPDATE and read-state UPDATE only to the seller subscriber; the third subscriber received zero.

Validation: schema-derived types include the new table/columns. Development now has 14 migrations, 11/11 RLS public tables, 45 constraints, 40 indexes, one read-state publication/policy/trigger, and one message delivery trigger. All three private functions are SECURITY DEFINER with empty search paths and postgres-only execute. The schema advisor adds no finding; the known Pro-only leaked-password Auth warning remains, and performance notices are new-dataset unused-index INFO only. Lint, TypeScript, 17/17 unit tests, the 37-route production build, and 4/4 Playwright tests pass. The exact authenticated room-list PostgREST embed returns one own read row, safe buyer/seller keys, and the listing. At 1440x900, 1024x768, 390x844, and 360x800 the signed-in header has no overflow/errors; mobile/desktop accessibility trees expose one unread message/notification. A live server-side read changed the browser badge 1→0, and an incoming message changed it 0→1 over protected Realtime. All Auth/public-user/listing/room/read/message/notification/job/object fixtures are zero. P1-007/P2-003 and ownership are released by this checkpoint.

Next slice: continue with the highest independent P1 gap; P0-005 and full protected Next-route journeys remain externally blocked by the missing development secret.

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
