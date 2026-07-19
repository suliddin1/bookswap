# Iteration log

## 2026-07-19 - P1 WCAG public discovery foundation

Goal / acceptance IDs: P1-011; A11Y-01, RESP-01, BROW-01, TEST-01.

Ownership: root exclusively owns the shared layout accessibility entry point, global focus/contrast/control tokens, site header and footer keyboard presentation, public home and catalog discovery presentation, listing-card interaction semantics, focused E2E/source tests, four-viewport optimized-production evidence, and affected durable documentation for this slice. Authentication, listing authoring/detail, profile, messaging, notifications, moderation, administrator controls, database schema, API behavior, and unresolved policy/legal content remain unchanged and outside this checkpoint.

Starting state: clean branch `autonomous/bookswap-product` at `863dc22`. The prior Azerbaijani trust-guidance checkpoint leaves P1-011 as the highest-priority unblocked item. Current public discovery uses visible focus on common controls and route-level reduced motion, but has no skip-to-content entry point; mobile navigation does not move focus into the opened menu or close/return focus on Escape; several essential labels and actions render at 8–11px; muted and gold text/control boundaries miss WCAG 2.2 AA contrast on their actual light surfaces; several authored targets are below the product's 44px target and the catalog clear-search control is smaller than the 24px AA minimum; and the listing favorite button is nested inside the listing link, creating invalid interactive semantics.

Planned contract: preserve the warm bookstore identity while introducing a keyboard-visible skip link and focusable main landmark; make the compact navigation disclose state, move focus on open, close on Escape, and restore focus; keep shared focus indicators visible above the sticky header; use measured AA-safe warm gold, muted text, and input-boundary colors; raise essential public discovery copy to a readable 12px floor; make primary authored discovery targets at least 44px; separate listing-link and favorite-button interaction semantics; add regression coverage for landmarks, keyboard menu behavior, accessible names, target geometry, contrast tokens, reduced motion, 200% text resize, and 320px reflow; verify the optimized production runtime at 1440x900, 1024x768, 390x844, and 360x800 before updating durable state and checkpointing.

Implemented: added the Azerbaijani skip link and focusable `main`, shared visible-focus/scroll-margin rules, current-page navigation, 44px header/footer/discovery targets, compact-menu open/Escape focus management, explicit catalog filter/category/result regions and busy/result status, readable public discovery labels, and measured warm palette/control-boundary tokens. Listing favorite controls are now siblings of cover links rather than nested interactive content. Framer reveal/card motion honors `prefers-reduced-motion`. Home/catalog grids, headings, filter fields, sort control, listing metadata, and card links now shrink or wrap under constrained enlargement without changing marketplace wire values or backend behavior.

Adversarial review: the first permanent 320px/200% catalog test found intrinsic category/sort width overflow; zero-minimum grid/field constraints and a full-width mobile sort control repaired it. The representative four-viewport matrix then found 200% home overflow from long Azerbaijani section headings and listing-card links at 360px; emergency heading wrapping and constrained card metadata repaired the document width. Measured key ratios are 4.669:1 for warm action text on paper, 4.503:1 for muted footer text, and 3.491:1 for input boundaries. The final eight-case fixture-backed production matrix found no unnamed or sub-24px authored control, nested interaction, long reduced-motion animation, page-width mismatch, clipped text, overlay/hydration error, console/page/request/HTTP failure, or visual regression. The unmocked run separately reproduced only the known wrong-project local Supabase 500 and is not claimed as backend success.

Validation: lint and strict TypeScript pass; 38/38 unit tests pass; the 37-route optimized production build passes; 13/13 Playwright tests pass. Home and catalog pass 1440x900, 1024x768, 390x844, and 360x800 base plus 200% text width checks; catalog also passes the durable 320x800/200% regression. Keyboard skip/menu/current-page behavior, named regions/controls, 44px primary geometry, palette ratios, reduced motion, invalid nesting, and visual hierarchy are covered.

Evidence boundary and cleanup: the ignored public Supabase ref mismatch and missing development secret remain untouched; fixture-backed listings are UI-only evidence. No database/schema/package/Auth/Storage/email/provider or other external mutation was made. The production server is stopped, port 3000 is free, and the temporary browser harness, screenshots, traces, and result directories are removed. Ownership is released by the coherent local checkpoint.

Next slice: continue P1-011 with public listing-detail and seller-action accessibility, prioritizing small text, review/report disclosures and statuses, target geometry, focus/contrast, reduced motion, and zoom/reflow. Do not begin it inside this checkpoint.

## 2026-07-19 - P1 Azerbaijani FAQ and safety guidance

Goal / acceptance IDs: P1-010; L10N-01, SEO-01, A11Y-01, RESP-01, BROW-01, TEST-01.

Ownership: root exclusively owns the FAQ and safety route copy/metadata, their shared presentation contract, focused tests, four-viewport production evidence, and affected durable documentation for this slice. Existing transaction behavior, payment/handoff options, reporting and moderation behavior, account eligibility, legal pages, database schema, notification producers, and user-authored content remain unchanged.

Starting state: clean branch `autonomous/bookswap-product` at `686e8f9`. The public `/faq` and `/safety` routes render Azerbaijani body text, but their copy remains scattered outside `lib/i18n.ts`; metadata and several headings/actions/condition names remain English or mixed-language. Safety guidance says chat creates moderation evidence in a way that can imply ongoing review and includes a minor instruction despite DR-003 being unresolved. The pages do not yet state the complete accepted no-protection boundary from ADR-012 and the product trust model.

Planned contract: centralize natural Azerbaijani FAQ/safety copy and metadata; translate presentation labels without changing stable listing condition or status values; state truthfully that users arrange transactions and BookSwap does not hold funds, verify every claim/condition, guarantee delivery, or insure exchanges; retain practical credential, inspection, public-meeting, reporting, bank, and emergency guidance without deciding unresolved age, payment, delivery, dispute, or contact-disclosure policy; improve FAQ/safety semantics where needed; verify metadata, accessible names, keyboard behavior, 200% zoom/reflow, exact viewport width, mojibake, overlays, hydration, and console/network failures at 1440x900, 1024x768, 390x844, and 360x800; then run the complete repository gate and update durable evidence.

Implemented: added typed FAQ/safety metadata, questions, answers, section IDs, guidance, and related-page actions to `lib/i18n.ts`; route components now render only that reviewed contract. Mixed English metadata, headings, condition names, dashboard/report/review actions, and `marketplace` wording were replaced with natural Azerbaijani. The safety boundary explicitly excludes held/processed funds, buyer protection, verified condition/claims, delivery guarantees, insurance, refunds, and platform dispute resolution. The unresolved minor instruction was removed, and chat history is described only as potentially useful during an investigation. Existing wire values, transaction behavior, moderation/report handling, account eligibility, schema, and legal pages are unchanged.

Accessibility/responsive repair: FAQ disclosures now expose at least 44px keyboard targets and visible focus; information sections may use explicit labelled landmarks; help actions use Next links and wrap within their container. The first 200% text-resize probe found the desktop header sign-in group overflowing at 1024px. The header now changes to its compact navigation below 1101px, and long Azerbaijani headings/actions wrap under constrained text size. Rebuilt optimized-production pages pass base and 200% text-resize width checks at all four required viewports.

Adversarial review: dictionary/source tests require the accepted no-protection language and reject unresolved age copy and the removed English trust heading. Production Chromium toggled the payment/handoff disclosure by keyboard, navigated FAQ to safety, checked all eight questions/four labelled sections, and found no stale age instruction, mojibake, hydration/framework overlay, console warning/error, page error, unexpected request failure, or HTTP 4xx/5xx. One exact Next RSC prefetch `ERR_ABORTED` occurred in each desktop/tablet context and none on mobile; these cancellations had no response/console effect and were classified separately. Visual inspection of all eight captures is clean.

Validation: lint and strict TypeScript pass; 38/38 unit tests pass; the 37-route optimized production build passes; 10/10 Playwright tests pass. FAQ and safety match 1440x900, 1024x768, 390x844, and 360x800 exactly, with `lang=az`, one `h1`, correct metadata, reduced motion, keyboard disclosure behavior, labelled sections, and 200% text resize. `git diff --check`, tracked UTF-8/mojibake scanning, and artifact review pass.

Evidence boundary and cleanup: no database/schema/package/Auth/Storage/email/provider mutation was made. DR-003 and DR-004 remain unresolved, SQL-authored legacy notification prose remains migration-bound, and legal operator/contact/retention/domain facts remain external. The production server is stopped, port 3000 is free, and the temporary browser harness, screenshots, and logs are removed. Ownership is released by the coherent local checkpoint.

Next slice: P1-010 has no remaining unblocked code-only guidance slice; its SQL/legal remainder needs authorization or external decisions. The next highest-priority unblocked item is P1-011, the WCAG 2.2 AA review and targeted remediation. Do not begin it inside this checkpoint.

## 2026-07-19 - P1 Azerbaijani API and optional-email copy

Goal / acceptance IDs: P1-010; L10N-01, NOTIF-01, AUTH-01, SVC-01, BROW-01, TEST-01.

Ownership: root exclusively owns the code-authored API error presentation contract, optional notification-email presentation, focused tests, four-viewport production/API evidence, and affected durable documentation for this slice. Stable HTTP statuses, machine codes, route identifiers, authentication/authorization, database schema, notification types/events, and user-authored message previews remain unchanged. Existing migration-authored legacy notification prose is explicitly outside this code-only slice.

Starting state: clean branch `autonomous/bookswap-product` at `3cd1b34`. Azerbaijani UI clients already map recognized machine codes and notification events, but the shared API serializer still emits English validation, rate-limit, generic, and route/provider/database messages on several direct-response paths. Optional notification email still uses English subjects and fallback prose and trusts raw payload message text instead of the reviewed notification presentation contract. The ignored local public configuration still targets a different project ref and no development service secret is available, so protected-route and real email-provider delivery remain blocked and must not be claimed.

Planned contract: serialize all API failures through safe Azerbaijani code mappings; preserve stable codes/statuses while replacing raw unexpected details and schema messages; localize remaining code-authored route errors; render optional-email subject/body from the same event-aware presentation used in-app with escaped user-authored previews and a safe system fallback; verify exact response shapes, no provider/database leakage, HTML escaping, unchanged wire identifiers, direct public API failures, and representative notification UI at 1440x900, 1024x768, 390x844, and 360x800; then run the complete repository gate and update durable evidence.

Implemented: added centralized API response copy and complete current machine-code mappings, sanitized Zod field details, removed arbitrary `Error.message` serialization, localized remaining route/auth errors, and preserved provider Auth code/status identifiers behind the safe Auth presentation map. Optional email now uses Azerbaijani message/system subjects and the shared event-aware notification body inside escaped `lang=az` HTML. Stable route names, HTTP statuses, API/notification codes, notification types/events, user preview text, authorization, and database schema are unchanged.

Adversarial review: a 503 `ApiError` carrying private provider detail serialized only the mapped Azerbaijani moderation failure; an unexpected 400 carrying a private table name serialized only generic `BAD_REQUEST`; malformed listing input exposed generic field guidance instead of Zod `Required`; an HTML-like message preview was escaped; and unknown system payload prose fell back safely. Direct production probes confirmed exact localized invalid-filter/invalid-ID/validation bodies and no submitted/schema detail. Browser-local Auth/API/Realtime representatives rendered notification events at all four viewports; they are UI evidence only. One exact Next RSC `ERR_ABORTED` prefetch cancellation per context was separated from unexpected failures.

Validation: lint and strict TypeScript pass; 37/37 unit tests pass; the 37-route optimized production build passes; 10/10 Playwright tests pass. Production Chromium passed `/notifications` at 1440x900, 1024x768, 390x844, and 360x800 with `lang=az`, one `h1`, private robots, deterministic Baku timestamps, exact width, clean desktop/mobile visual hierarchy, and no unexpected overlay, hydration, console, page, request, or HTTP failure. `git diff --check` and the UTF-8/mojibake scan pass.

Evidence boundary and cleanup: no database/schema/package change or external mutation was made. No protected route or real email provider was exercised because the service secret remains absent and ignored local public configuration points at a different ref. The production server is stopped, port 3000 is free, and the temporary browser harness, screenshots, and result directory are removed. Ownership is released by the coherent local checkpoint.

Next slice: continue P1-010 with the unblocked FAQ/safety guidance centralization and native-language consistency review. Legacy SQL-authored notification prose remains migration-bound; legal operator/contact/retention/domain facts remain externally blocked. Do not begin that next slice inside this checkpoint.

## 2026-07-19 - P1 Azerbaijani administrator dashboard and actions

Goal / acceptance IDs: P1-010; L10N-01, ADMIN-01, ADMIN-02, MOD-01, REP-01, SEO-01, RESP-01, A11Y-01, BROW-01, TEST-01.

Ownership: root exclusively owns the administrator route metadata, dashboard presentation and response parsing, administrator action/API error copy, shared Azerbaijani admin labels and deterministic formatting, focused tests, browser evidence, and affected durable documentation for this slice. Existing RPC names, wire actions/statuses, authorization, transaction boundaries, database schema, and immutable audit records remain unchanged.

Starting state: clean branch `autonomous/bookswap-product` at `4632983`. The immutable administrator-action and automated-moderation ledgers are complete, but `/admin` has no localized metadata or private robots contract and exposes English headings, statistics, reason guidance, loading/error/action states, table labels, account/report/privacy controls, audit/moderation labels, fallback text, and runtime-dependent date-time formatting. The client trusts untyped dashboard bodies and displays raw route messages. Protected Next-route browser execution remains blocked by P0-005, so representative UI evidence must remain browser-local and must not be claimed as backend evidence.

Planned contract: add Azerbaijani private route metadata and a centralized admin copy/label contract; preserve all machine values while translating their presentation; parse the dashboard response defensively; map recognized API codes to safe localized feedback; replace runtime locale defaults with the explicit Baku formatter; provide named loading, empty, busy, error, table, status, and action states; verify no stale owned English, mojibake, hydration/runtime errors, horizontal page overflow, inaccessible controls, or unintended protected mutations at 1440x900, 1024x768, 390x844, and 360x800; then run the complete repository gate and update durable evidence.

Implemented: added Azerbaijani private route metadata, centralized administrator copy, audit/action/state and moderation diagnostic label maps, safe administrator API error messages, and deterministic Baku timestamps. The client now strictly parses the complete dashboard response before rendering, ignores raw server/parser prose, preserves action/status/category identifiers beside translated administrator diagnostics, exposes named loading/empty/error/busy/success states, and improves table/control/long-address semantics. Stable RPCs, authorization, transaction boundaries, database rows, and immutable audit content are unchanged. The moderation email handoff now carries a stable event identifier plus reviewed Azerbaijani body copy.

Adversarial review: malformed representative dashboard data produced only the safe Azerbaijani fallback; signed-out admin started no protected request. Browser-local success and 409 conflict actions preserved `approve`, listing ID, and a bounded reason, while the conflict exposed only localized `ADMIN_ACTION_CONFLICT` copy. The first external browser attempt reproduced the documented ignored-local-config DNS boundary, so Auth/API/Realtime were fully isolated in the final representative matrix and no protected-route/backend success is claimed. One exact Next RSC prefetch cancellation and the expected simulated 409 resource line were classified separately; every other console, request, response, hydration, and overlay failure remained fatal.

Validation: lint and strict TypeScript pass; 34/34 unit tests pass; the 37-route optimized production build passes; 9/9 Playwright tests pass. Production Chromium passed `/admin` at 1440x900, 1024x768, 390x844, and 360x800 with `lang=az`, one `h1`, private robots, deterministic `14 iyl 2026, 22:05`, localized audit/moderation/state presentation, exact page width, contained table scrolling, and no unexpected browser failure. Desktop/mobile visual inspection preserved the bookstore UI. No database, Auth, Storage, email-provider, or protected route mutation was made.

Evidence boundary and cleanup: P0-005 still blocks real authenticated Next admin execution. The production server is stopped, port 3000 is free, and the temporary browser harness, screenshots, logs, and Playwright result file are removed; the repository-local Playwright runtime remains. Ownership is released by this coherent local checkpoint.

Next slice: continue P1-010 with the broader user-facing API error and transactional email/durable-notification copy inventory. Reviewed legal facts remain externally blocked and P1-011 remains the next independent non-localization item.

## 2026-07-14 / recovered 2026-07-19 - P1 Azerbaijani messaging and notification journeys

Goal / acceptance IDs: P1-010; L10N-01, CHAT-03, NOTIF-01, MOD-01, SEO-01, RESP-01, A11Y-01, BROW-01, TEST-01.

Ownership: root exclusively owns the Azerbaijani copy/formatting contract, messages/chat/notification route metadata and components, their hooks and safe client error mapping, notification delivery copy and any required additive migration, focused tests, browser evidence, and affected durable documentation. Delegated specialists are read-only and may not edit repository files.

Starting state: clean branch `autonomous/bookswap-product` at `84fd1b9`. Public discovery, listing, authoring, authentication, profile, and reader privacy journeys are localized, but messages, room chat, unread states, and notifications still expose English headings, actions, empty/loading/error text, timestamps, accessible labels, trust guidance, and database-created notification prose. Protected Next-route mutation evidence remains blocked by P0-005, so this slice must preserve wire values and distinguish real public/direct-backend evidence from representative UI-only states.

Planned contract: inventory every owned user-visible string and notification writer; centralize natural Azerbaijani copy and deterministic date/time presentation; preserve route IDs, notification types, and database/API wire values; map recognized machine failures to safe localized messages without leaking provider/database prose; add honest private-route metadata; verify unread/read/send/moderation/loading/empty/error semantics, keyboard names, live-region behavior, touch/reflow, source contracts, full repository gates, four viewports, console/network output, and cleanup without claiming blocked protected mutations.

Implemented: centralized message-list, room-chat, notification, private metadata, trust, action, loading/empty/error, unread, and accessible-label copy in the Azerbaijani contract. Added deterministic Baku clock/date-time helpers, known notification payload presentation with safe fallbacks, strict room/message response parsing, narrow chat-room selects, UUID route validation, observable database-query failures, signed-out request suppression, reconnect reload/read acknowledgement, semantic lists/times/statuses, a labelled multiline composer, and responsive notification/chat controls. Stable room IDs, notification types/payload identifiers, marketplace wire values, and user-authored message text remain unchanged.

Hydration/runtime recovery: the interrupted components used locale-default `toLocaleTimeString([])` and `toLocaleString()`, leaving time text dependent on Node/Chromium locale and ICU behavior. All affected timestamp rendering now uses the explicit `Asia/Baku` contract. Regression tests assert `22:05` and `14 iyl 2026, 22:05` and reject reintroduction of runtime-default locale calls. Production Chromium rendered those exact values with no hydration error or framework overlay in all 12 route/viewport cases.

Validation: lint and strict TypeScript pass; 33/33 unit tests pass; the 37-route optimized production build passes; 9/9 Playwright tests pass. Browser-local representative Auth/API/Realtime states exercised messages, notifications, and chat at 1440x900, 1024x768, 390x844, and 360x800 with one `h1`, private robots, exact viewport width, no mojibake/overlay/unexpected console-page-request-HTTP failures, and clean visual reflow. The expected simulated moderation 503 mapped to safe Azerbaijani copy; read-all exposed a success status. Signed-out E2E proves all three routes start no protected request.

Evidence boundary and cleanup: no protected route or backend mutation was claimed. The service secret remains absent, and ignored `.env.local` public configuration points at ref `lnhublqrtkdrrafghvki` rather than the authorized development ref `uibatsbzjswmtdvdrlxj`; it was preserved and the representative runtime was fully stubbed in-browser. Three stale audit screenshots plus the temporary matrix script/screenshots/test output were removed, while the repository-local Playwright runtime was preserved. Ownership is released by this coherent local checkpoint. No next major slice was started.

## 2026-07-14 - P1 Azerbaijani profile and privacy-request journeys

Goal / acceptance IDs: P1-010; L10N-01, PROF-01, LIST-01, FAV-01, REP-01, SEO-01, RESP-01, A11Y-01, BROW-01, TEST-01.

Ownership: root exclusively owns the Azerbaijani contract additions, profile and user-rights metadata, profile dashboard and privacy-request components, user profile/privacy response shaping and safe client error handling, focused tests, browser evidence, and affected durable documentation for this slice. No other agent is editing these files.

Starting state: clean branch `autonomous/bookswap-product` at `e08f91a`. Listing authoring and authentication are localized, but the private dashboard still exposes English tabs, statistics, listing actions, profile fields, unsafe raw route errors, a broad own-profile response, and silent partial-query failures. The privacy form exposes English request/status values, hides initial-load failure, lacks busy/error semantics and dates, and the public user-rights route has English metadata plus mixed terminology.

Planned contract: centralize profile/privacy copy and request/status labels; preserve privacy request and listing wire values; return only dashboard-required profile fields and fail the profile aggregate when any constituent query fails; map machine errors to safe Azerbaijani fallbacks; localize metadata, private robots, counts, listing actions, confirmation, profile help, request history, dates, loading/empty/error states, and accessible tab/current/busy semantics; prove signed-out and representative authenticated UI at four viewports without claiming blocked protected mutations.

Implemented: extended the typed Azerbaijani contract through the profile dashboard, profile editor, listing-state actions, privacy-request form/history, and user-rights route. Stable listing/privacy wire values remain unchanged while labels, money, dates, statuses, locations, validation, alerts, help, loading/error/empty states, and metadata are localized. The profile API returns only `name`, `phone`, and `city`, fails the aggregate if any constituent query fails, and both profile/privacy routes preserve recognized API errors while returning a safe 500 response for unexpected faults. Signed-out profile/privacy views no longer start protected requests. Tabs, navigation, current/pressed states, busy/status feedback, field hints, and affected touch targets have explicit semantics.

Adversarial review: representative authenticated UI used a real development Auth session but browser-only profile/privacy GET responses because the unavailable service secret still blocks truthful protected Next-route execution. No profile, listing, or privacy mutation was submitted. A fresh real token caused direct unread/notification requests to report PostgREST `PGRST303` (`JWT issued at future`); database and local UTC clocks matched when checked, so no persistent clock skew was demonstrated. The final UI-only matrix stubbed those unrelated counters and does not count as backend evidence. This anomaly remains with authenticated browser coverage instead of triggering another repair cycle.

Validation: lint and strict TypeScript pass; 31/31 unit tests pass; the 37-route production build passes; 8/8 Playwright tests pass. Profile and user-rights views passed at 1440x900, 1024x768, 390x844, and 360x800 with `lang=az`, one `h1`, exact viewport width, localized labels/dates/statuses, private profile robots, and no stale owned English or mojibake. Every profile tab was exercised. A final clean representative UI matrix had no unexpected console/page/request or HTTP error after the unrelated counters were stubbed; protected route mutations remain unverified.

Cleanup and stop point: the temporary Auth user, identity, sessions, refresh tokens, public profile, listings, and privacy requests were removed; a final development query returned zero for every checked table. The temporary server is stopped, port 3000 is free, and browser screenshots/logs are removed. This coherent checkpoint remains deliberately uncommitted because the user stopped the loop before another iteration.

## 2026-07-14 - P1 Azerbaijani listing authoring and authentication

Goal / acceptance IDs: P1-010; L10N-01, AUTH-01, AUTH-02, LIST-01, IMG-02, MOD-01, SEO-01, RESP-01, A11Y-01, BROW-01, TEST-01.

Ownership: root exclusively owns the Azerbaijani contract additions, listing create/edit/auth/password-reset route metadata and components, client upload/auth error mapping, focused tests, browser evidence, and affected durable documentation for this slice. No other agent is editing these files.

Starting state: clean branch `autonomous/bookswap-product` at `7b4365e`. Public discovery, detail, seller, and favorites are Azerbaijani, but listing create/edit and login/signup/magic-link/reset surfaces expose English steps, fields, values, accessible image controls, validation, raw Supabase/API errors, recovery states, and generic/missing metadata.

Planned contract: centralize the complete authoring/auth copy and safe machine-error mappings; preserve marketplace wire values while translating controls; localize image validation/upload/cleanup and moderation/listing failures without leaking backend prose; add honest route metadata/robots; prove form states, keyboard names, preview/currency, sign-in/signup/recovery transitions, responsive reflow, no old copy/mojibake/runtime errors, full repository gates, and cleanup. Protected create/edit route mutation remains honestly blocked by P0-005 unless the development service secret becomes available.

Implemented: extended the typed copy contract through listing creation/editing, local image validation/upload/cleanup, login, signup, password recovery/update, and authenticated-client preconditions. Category/condition/city controls show Azerbaijani while retaining English wire values. Listing API and Supabase Auth failures map recognized machine codes to safe Azerbaijani fallbacks; provider/database prose and configuration instructions are no longer exposed. Authoring previews use deterministic manat formatting, edit adds localized selectors for all stored marketplace codes, condition choices expose `aria-pressed`, and top-level auth/edit states use one `h1`. All four private routes have Azerbaijani title/description metadata and `noindex,nofollow`.

Adversarial review: the production form journey retained `Fiction` and `Baku` in the controls while rendering `Bədii ədəbiyyat` and `Bakı`. A browser-local valid PNG reached the final `24,5 ₼` preview without upload or publication. One real invalid-credential request returned the expected Auth 400 and displayed only `E-poçt ünvanı və ya parol yanlışdır.`; a clean context remained console/network-error free. Signup, magic-link, reset-email, password update, upload, and listing mutation were deliberately not submitted. The missing development service secret still prevents truthful end-to-end protected create/edit verification, while outbound email and account creation would be external side effects outside this localization proof.

Validation: lint, strict TypeScript, 30/30 unit tests, the 37-route production build, and 7/7 Playwright tests pass. Production new/edit/login/reset routes passed a clean 16-case matrix at 1440x900, 1024x768, 390x844, and 360x800 with `lang=az`, one `h1`, private robots, zero stale owned English, overflow, mojibake, console/page/request failures, or HTTP 4xx/5xx. Interactions covered authoring steps, stable select values, selected condition semantics, browser-only image preview/removal vocabulary, localized edit controls, login/signup/recovery modes, safe Auth failure mapping, and local password mismatch. Visual inspection passed one representative page at each viewport class.

Cleanup: one temporary Auth-backed seller/listing supplied the real edit GET; no browser data mutation or Storage upload occurred. Sessions and refresh tokens were removed before identity/Auth deletion, and final Auth user/identity/session/refresh-token/public profile/listing counts are zero. The production server, screenshots, and logs were removed. Ownership for this slice is released by the local checkpoint.

Next slice: translate profile dashboard and privacy-request journeys, including listing states/actions, counts, price/date/location, account updates, privacy types/outcomes, and safe route errors. P0-005 remains the sole externally blocked P0.

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
