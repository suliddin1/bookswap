# Architecture decisions

Statuses: Accepted governs current work. Proposed requires resolution or implementation evidence. Superseded entries must link to their replacement.

## ADR-001 — Preserve the Next.js App Router application

Status: Accepted.

Keep the existing Next.js 15 App Router, React, TypeScript, Tailwind, route-handler, and component structure. Refactor incrementally around acceptance criteria. A greenfield rewrite would discard working routes, tests, security work, and visual identity without evidence of benefit.

## ADR-002 — Supabase remains the backend contract

Status: Accepted.

Use Supabase Auth, Postgres, Storage, and Realtime. Schema changes are ordered migrations; applied migrations are immutable. Every schema change is applied to non-production first, inspected, advisor-checked, type-generated, and exercised through the same API surface the application uses.

## ADR-003 — Separate development and production

Status: Accepted.

The authorized zero-cost bookswap-development project (ref uibatsbzjswmtdvdrlxj, eu-central-1) is the current disposable development target. The inactive legacy project is not assumed to be production or safe to modify. Never apply preparation or test changes to a production database.

## ADR-004 — Service-role boundary and defense in depth

Status: Accepted.

Public reads may use a publishable/anon client. Authenticated mutations currently pass the user's access token to a server route, verify it, then use a server-only service-role client. Because service role bypasses RLS, every route must explicitly enforce ownership, role, ban state, object path, and listing/room state. RLS, least-privilege grants, constraints, and route authorization all remain required.

## ADR-005 — Model book identity separately from a physical copy

Status: Proposed, required for exchange/shelves.

The existing listings table represents a physical copy. Add a normalized book/title identity (with optional edition/ISBN variants) rather than overloading listings. Shelves and wanted books should reference title/edition identities; offers reference physical copies. Migration design must preserve all current listing IDs and API behavior.

## ADR-006 — Explicit sale/exchange intention

Status: Accepted direction; implementation pending.

Each physical-copy offer is sale, exchange, or both. Price is required only when sale is enabled. Negotiability is separate. Desired exchange titles are structured preferences with a free-text fallback. Existing sale listings migrate to sale intent without data loss.

## ADR-007 — Privacy-preserving exchange matching

Status: Proposed, launch-required.

Match candidates are computed from offered/owned and wanted title identities plus eligible public listing state. Return only public listing/profile data and approximate location. Never expose private shelves, exact location, contact information, or a user's full wanted graph. Users explicitly initiate chat; dismissal/block/report suppresses future suggestions.

## ADR-008 — Azerbaijani-first localization

Status: Accepted; implementation in progress.

Adopt Azerbaijani as the default locale and document language while preserving user-entered Azerbaijani/Russian/English book data. `lib/i18n.ts` is the typed copy/label/formatting contract. English category, condition, city, status, sort, privacy-request type/status, notification type/event, administrator audit/action/moderation identifiers, and future intention values remain stable database/API/query codes and receive Azerbaijani presentation labels; unknown user content passes through unchanged, while unknown protected diagnostics use a safe generic label. AZN output uses deterministic grouping/decimal separators plus an explicit non-breaking-space manat symbol; dates and clock times use explicit Azerbaijani month names and the Asia/Baku calendar boundary. Runtime-default `toLocaleString`/`toLocaleTimeString` output is prohibited on localized surfaces because Node and Chromium locale/ICU defaults can diverge during hydration or client rendering. Root metadata/manifest, shell/global states, discovery/detail/seller/favorites, listing authoring/editing, authentication/recovery, profile dashboard, reader privacy requests, user-rights, messages, room chat, notifications, and administrator UI/actions implement this decision. Known notification payload identifiers and legacy listing-moderation messages map to reviewed Azerbaijani presentation without translating user-authored message previews; unknown payloads use a safe generic fallback. Protected client boundaries must validate response shapes and prefer machine-code mappings plus generic Azerbaijani fallbacks over raw provider/database/parser prose. All remaining surfaces are tracked in `LOCALIZATION_INVENTORY.md` and remain launch-blocking.

## ADR-009 — Preserve the established visual system

Status: Accepted.

Fraunces/Manrope, warm ivory/walnut/paper palette, restrained gold, shelves, cards, cover fallbacks, header/footer, state vocabulary, focus visibility, and reduced motion are protected. References may influence workflows but not visual replacement. Accessibility and responsive refinements must be targeted and evidence-backed.

## ADR-010 — Stable cursor pagination

Status: Accepted and implemented.

Replace fixed-limit catalog retrieval with opaque cursor pagination using a deterministic sort tuple. Newest uses (created_at, id); price sorts include price plus a deterministic tie-breaker. Filters and sort are part of cursor validity. Responses provide items and nextCursor; no duplicates or gaps under normal concurrent inserts.

The deployed contract uses versioned canonical base64url JSON, a SHA-256 scope over normalized filters or seller ID, strict tuple validation, and PostgREST keyset predicates. Catalog and seller clients accumulate pages with stale-request/version guards and ID de-duplication. Active-price and public-seller partial indexes support the access paths. Live equal-price/equal-timestamp/concurrent-insert tests are required regression evidence.

## ADR-011 — Protected Realtime only

Status: Accepted.

Messages and notifications use RLS-protected Postgres Changes subscriptions. The redundant public room Broadcast and listener were removed; a source-contract test prevents reintroduction. Live buyer/seller/third-user evidence confirms the published `public.messages` stream delivers only rows permitted by table SELECT RLS. Any future Broadcast carrying private data would require a separate decision, private channel configuration, `realtime.messages` policies, and proof that public access is disabled.

## ADR-012 — No integrated payment or controlled shipping yet

Status: Accepted.

The platform supports discovery, conversation, and user-arranged local handoff/optional delivery. It must not claim escrow, payment protection, delivery guarantees, insurance, or verified condition. Payment/shipping integration requires a separate legal, operational, and technical decision.

## ADR-013 — Durable product evidence

Status: Accepted.

The acceptance matrix is the definition of done. Project state records facts, issue queue records work, QA evidence records commands and behavior, iteration log records chronology/ownership, and decision requests contain only unresolved external/product choices. No final completion report exists until every launch gate passes.

## ADR-014 — Resolve public profile grants without widening private data

Status: Accepted.

Keep `public.users` column grants limited to `id`, `name`, `city`, and `created_at`; never grant broad table reads to `anon` or `authenticated`. Policies that need ban state call the stable, strict, security-definer `private.user_is_active(uuid)` predicate. The `private` schema is not exposed through the Data API, the function has an empty search path, and execute is restricted to `anon` and `authenticated`. Public catalog/detail queries may therefore retain atomic PostgREST embeds that explicitly name only the four safe profile fields. Direct Data API tests must continue to prove safe reads succeed, private fields and `*` fail, and banned sellers/listings are absent.

Chat-room seller ownership is independently enforced with qualified RLS and a composite `(listing_id, seller_id) -> listings(id, seller_id)` foreign key so privileged writes cannot create a mismatched room.

## ADR-015 — Favorites never confer listing visibility

Status: Accepted.

A favorite is a user-owned pointer, not an authorization capability. Only active/sold listings from active sellers may be newly saved or returned. The service-role route applies explicit joined filters, validates the nested result again before serialization, and rejects unavailable writes. Database RLS repeats requester, ban, listing-state, and seller-state checks for direct clients. A private security-definer predicate and before-write trigger enforce the target invariant even for service-role writes and close state-transition races. Hidden stale rows may remain temporarily but are never readable; the requester-scoped server DELETE can remove them, and listing deletion cascades them.

## ADR-016 — Listing images use reference-safe durable cleanup

Status: Accepted.

Uploaded listing images use the public `listing-images` bucket for intentional cover delivery and the exact `{user_id}/{safe filename}` object shape for ownership. Every privileged cleanup first converts a URL from the configured Supabase host into that exact owner path; foreign hosts/folders, nested paths, traversal encoding, queries, fragments, and unsupported extensions are rejected. Authenticated Storage metadata selection and deletion are limited to the caller's first path segment.

Replacing images or deleting a listing enqueues obsolete URLs through a security-definer database trigger in the same transaction as the listing mutation. The queue is RLS-enabled, grant-revoked, explicitly false for anon/authenticated, and accessible only to trusted server code. The server drains through the Storage API, discards a job if any owner listing still references the URL, records failures for retry, and exposes pending cleanup without rolling back an already-successful listing mutation. Fresh uploads abandoned by validation, moderation, or database failure use the same reference check and durable queue. Direct edits to `storage.objects` remain prohibited.

## ADR-017 — Message delivery owns unread and in-app notification state

Status: Accepted.

Every chat room has one service-maintained read-state row per participant. Clients may SELECT only their own row through RLS and receive only permitted Postgres Changes; they cannot write counts directly. A restricted security-definer trigger validates the sender against the room even for privileged inserts, increments only the recipient, updates room activity, and creates one uniquely message-linked notification in the same transaction as the message. Any required in-app delivery failure aborts the message instead of becoming a detached promise.

Read acknowledgement sets the participant count to zero, records server time, and marks that room's linked message notifications read in the same transaction. Visible chat tabs acknowledge live messages; hidden tabs retain unread state. Reconnect always reloads the database before merging later events. Optional email is not the required delivery channel: system notification insertion is awaited, while email attempt/delivery outcome is explicit and may be retried by future infrastructure without weakening the in-app guarantee.

## ADR-018 — Moderation is typed, fail-closed, and content-minimized

Status: Accepted.

Automated moderation has exactly three application outcomes: approved, rejected, and unavailable. Local marketplace rules may reject known unsafe input, but an absent, timed-out, unreachable, rate-limited, failed, or malformed provider can never produce approval. Required listing text/images and chat text therefore fail with an explicit Azerbaijani 503 when moderation is unavailable and 422 when rejected. Authentication, listing ownership, and room membership are checked before provider use.

Every automated text/image outcome must be written before the mutation continues to an RLS-enabled ledger that exposes only request/actor/target IDs, surface, provider/outcome/reason/category diagnostics, provider decision ID, and timestamp. Submitted text and image URLs are intentionally absent. The application service role may insert and select but not update or delete; anon/authenticated roles have no grants and an explicit false policy. Admins review recent decisions through the protected dashboard. A ledger-write failure is itself fail-closed. The optional configured adapter uses OpenAI's Moderations API for validated text and multimodal image results, but production provider ownership, escalation, retention policy, and credentials remain external launch decisions.

## ADR-019 - Administrator actions are transactional and append-only

Status: Accepted.

Administrator bans, listing moderation, report decisions, privacy-request decisions, and appeal decisions execute through narrowly granted service-role RPCs. Each RPC repeats an active, non-banned administrator lookup from `public.users`, validates a bounded reason and state transition, locks the target, applies the mutation, and inserts the actor/target/action/reason/before/after/timestamp history in one database transaction. Required in-app listing-moderation notification creation shares that transaction; optional email does not.

The administrator ledger is separate from automated moderation decisions because it records human accountability and state changes rather than provider diagnostics. It is RLS-enabled and content-minimized, gives service role SELECT only, denies direct client access, and rejects update/delete attempts with a trigger. Public security-definer functions revoke default `PUBLIC`, anon, and authenticated execution and grant only service role. Actor names are snapshotted and actor IDs deliberately do not cascade so account deletion cannot erase who performed a historical action. Application roles cannot insert, edit, or remove history.

## ADR-020 - Public listing mutations use the protected server boundary

Status: Accepted.

All listing INSERT, UPDATE, and DELETE operations pass through authenticated Next route handlers. Anon and authenticated database roles may SELECT listings under RLS but have no direct table mutation grants; service role receives explicit CRUD for the server boundary. Existing ownership and active-user RLS policies remain defense in depth rather than the primary publication path. Browser Storage upload remains separately owner-folder-scoped and does not grant listing-row mutation.

Any transition from a non-active state into public `active` status is a publication event. It must moderate the final title/description and every final image before the state change, even when the request changes only status. An already-active edit moderates changed text and new images, avoiding redundant checks without creating a bypass. Locked listings cannot be edited through the seller route. Missing, failed, or malformed required moderation remains unavailable and prevents publication.

## ADR-021 - User-facing API and optional-email copy is code-driven and fail-safe

Status: Accepted.

HTTP status and machine `code` values remain the stable API contract; natural-language `error` text is presentation. The shared serializer maps every recognized code to reviewed Azerbaijani, replaces Zod/schema detail with generic per-field Azerbaijani guidance, and returns generic Azerbaijani copy for unexpected 4xx/5xx failures. Provider, database, configuration, and arbitrary `Error.message` text may be logged internally when appropriate but must never be serialized to users. Auth-provider error responses preserve safe code/status identifiers while replacing provider prose with the existing Azerbaijani Auth mapping.

Optional notification email is derived from the same stable type/event and reviewed presentation function used in-app. Subjects and fallback bodies are Azerbaijani, HTML declares `lang=az`, and user-authored message previews are preserved only after HTML escaping. Unknown system payload prose is not trusted and falls back safely. Required durable in-app notification semantics from ADR-017/ADR-019 are unchanged; email remains optional, and changing already applied SQL-authored legacy notification prose requires a separate additive migration with authorized development verification.

## ADR-022 - Public trust guidance is centralized and policy-bounded

Status: Accepted.

Public FAQ and safety metadata, questions, answers, section labels, and action names are code-owned by the typed Azerbaijani presentation contract. Route components render that reviewed data without duplicating policy prose. Stable listing condition/status values and user-authored content remain unchanged; only their presentation labels are localized.

Trust guidance must reflect ADR-012 and the product trust model: BookSwap facilitates discovery and communication but does not hold funds, provide buyer protection, verify every condition or claim, guarantee handoff/delivery, or insure an agreement. General credential, inspection, public-meeting, reporting, bank, and emergency risk-reduction guidance is not a protection promise. Age-specific rules, allowed payment/delivery arrangements, dispute boundaries, and contact-disclosure policy remain excluded until DR-003/DR-004 are decided. Chat history may be described only as potentially helpful to an investigation, never as continuously monitored or guaranteed evidence.

## ADR-023 - Accessibility remediation is measured, shared, and incremental

Status: Accepted.

WCAG 2.2 AA remediation preserves the established bookstore identity and proceeds by coherent user journey rather than a global redesign or an unsupported conformance claim. Shared semantics and tokens belong at the shell/design-system boundary; journey-specific keyboard, status, target, and reflow behavior remains with the owning component. Each completed slice must retain durable browser regressions and four-viewport optimized-production evidence, while the acceptance matrix remains Partial until every core flow receives equivalent review.

For authored pointer controls, 24 by 24 CSS pixels is the WCAG 2.2 AA minimum subject to its defined exceptions; BookSwap targets at least 44px for primary owned controls where practical. Keyboard entry begins with a visible skip link and focusable main landmark. Focus must remain visible and unobscured by the sticky header. Interactive elements cannot be nested. Dynamic regions expose names and status/loading semantics. JavaScript motion consults the user's reduced-motion preference in addition to the global CSS fallback.

The shared warm colors use measured contrast-safe tokens for their owned contexts: warm action text `#8f6213` on paper, muted text `#6b6254` on the footer/light surfaces, and control boundary `#95866f` against the light input surface. Text and grid containers must shrink or wrap at 200% enlargement and 320 CSS pixels without document-level horizontal overflow or lost functionality. Browser-local API fixtures may isolate presentation when the known development configuration blocker is present, but such results are UI/runtime evidence only and must be paired with an explicit unmocked boundary check.

## ADR-024 - Listing-detail accessibility state is explicit and reflow-safe

Status: Accepted.

The public listing-detail gallery is one named region/group, and each thumbnail exposes its selected state rather than relying on border color. Favorite state is a pressed toggle. Review and report forms retain visible labels, associate dynamic feedback with the form, announce atomic status changes, and prevent duplicate submission while busy. Native report disclosure semantics remain intact; its summary uses the shared visible focus treatment and a 44px owned target. Signed-out feedback may be verified without submitting a protected mutation.

Listing-detail content is untrusted in length. Titles, authors, descriptions, ISBNs, seller names, review text, and action copy must wrap within zero-minimum containers. Current and original prices may wrap as a pair, and mobile metadata/seller presentation may stack. At 200% text size and 320 CSS pixels, the page must preserve every action and status without document-level horizontal overflow. A fixture may represent active and sold UI states only when paired with the unmocked public API boundary, per ADR-023.

## ADR-025 - Form journeys use explicit validation and managed replacement focus

Status: Accepted.

Multi-step and mode-switching forms may replace content before the user's current control. Their progress or mode must have an explicit accessible name/state, and the newly inserted step, mode, or completion heading receives programmatic focus with `tabIndex=-1`. This focus change is reserved for user-initiated replacement; initial route render does not steal focus. Busy forms identify their state, loading and photo collections are named, and assertive errors remain associated with their owning form/control.

Required progression cannot rely on a disabled next action without explanation. BookSwap's authoring flow keeps advancement operable, provides reviewed Azerbaijani validation, identifies and focuses the first invalid control, and uses native required/minimum constraints where they match the server contract. Hidden file inputs transfer visible focus treatment to their authored label. Password fields expose standard input-purpose tokens and persistent visible guidance through `aria-describedby`; guidance remains outside the label so it does not inflate the concise accessible name. Form labels, hints, statuses, controls, progress connectors, cards, and action rows must retain the ADR-023 contrast, target, reduced-motion, and 320 CSS px/200% reflow contracts without changing marketplace/Auth wire behavior.

## ADR-026 - Private account presentation is identity-stable and tab-semantic

Status: Accepted.

The profile dashboard is content inside the shared page `main`, not a nested main landmark. Its mutually exclusive sections use the WAI-ARIA tab model: one named tablist, one selected tab in the roving tab order, Arrow/Home/End keyboard activation, and one panel labelled by the active tab. Per-section headings still name their content. Load, listing-action, form-error, and success states are explicit and focusable when they replace or remove the user's active control.

Private client presentation is keyed by authenticated user ID. When that ID changes, prior account data is removed before the next request so a failed account switch cannot leave another account's dashboard visible. Repeated Auth emissions for the same ID do not restart protected GETs. Profile fields may remain uncontrolled only if a normalized successful response changes their form key and therefore refreshes displayed defaults; later edits clear stale saved status.

Profile and privacy forms follow ADR-025's localized first-invalid focus/error contract, keep visible guidance associated with its owning control, and use live/focusable final feedback. Profile names, listing actions, privacy history, status pills, and authenticated header controls follow ADR-023's 12px text, measured boundary, target, reduced-motion, and constrained-enlargement rules. The authenticated header may wrap rather than overflow at 200% text, and its compact menu must preserve account sign-out. Browser-local private fixtures remain presentation evidence only and do not weaken the explicit missing-secret/configuration boundary.

## ADR-027 - Messaging presentation is identity/context-stable and log-semantic

Status: Accepted.

Private message-room, notification, action-feedback, loading/error, draft, and unread-count presentation is owned by the authenticated user ID; a chat view is additionally owned by its room ID. Prior-owner data is never rendered while the next identity loads. Repeated Auth emissions for the same user do not restart protected GETs. Room detail must identify the expected current user, and stale fetch, Realtime, read-acknowledgement, or send completions cannot update another active context. This client isolation complements rather than replaces ADR-004/ADR-011 server authorization and protected Realtime enforcement.

Conversation history is a named, keyboard-scrollable `log` whose additions are polite and whose entries expose sender context independent of visual alignment. Initial/new messages follow the bottom only while the reader remains near it; scrolling upward is not overridden. A successful or failed current-context send restores composer focus, while changing the draft clears stale send feedback. When mark-all-read removes its initiating notification control, the replacement outcome receives visible programmatic focus. Protected load failures receive the same focus treatment.

Messages, names, titles, status copy, timestamps, and composer layouts follow ADR-023's contrast, 12px essential-text, target, reduced-motion, and 320 CSS px/200% reflow contracts. Client parsers reject invalid timestamps before calling ADR-008's deterministic Baku date/time formatters, preventing malformed private payloads from becoming hydration/runtime failures. Browser-local fixtures remain presentation evidence only and do not weaken the explicit protected-route configuration boundary.

## ADR-028 - Administrator presentation is identity-owned, action-explicit, and table-semantic

Status: Accepted.

Private administrator data, load failure, reason draft, feedback, and pending action state are owned by authenticated user ID. An identity change hides prior data before the next request, clears action state, aborts the prior load, and prevents stale fetch, action, or refresh completions from updating the next administrator context. Repeated Auth emissions for the same user ID do not restart protected reads. This presentation isolation complements rather than replaces ADR-019's server authorization, transactional RPC guards, and immutable ledger.

Administrator decisions require a visible bounded reason. Controls remain operable when that reason is invalid so the textarea can receive deterministic first-invalid focus, invalid state, and associated guidance/error text. Each repeated control exposes its target context in the accessible name and preserves stable wire IDs/actions. When a successful action removes its initiating row, replacement feedback receives visible programmatic focus. Mutation success followed by refresh failure is reported as a recorded action with unavailable refreshed data, never as an ambiguous mutation failure.

Dashboard navigation names its destinations and focuses the chosen heading. Collections use named list semantics; the moderation listing table preserves caption, scoped headers, and cell relationships inside a named keyboard-focusable horizontal scroll region rather than flattening relational data into cards. Long private and diagnostic content follows ADR-023's 12px essential-text, contrast, measured-target, reduced-motion, and zero-minimum wrapping contracts. At 320 CSS pixels and 200% text size, document-level width remains exact; intentional two-dimensional table overflow stays inside its labelled region. Administrator timestamps are validated before ADR-008 formatting, and invalid nested audit timestamps degrade to safe generic presentation rather than throwing. Browser-local fixtures remain UI/runtime evidence only and do not weaken the explicit missing-secret/public-configuration boundary.

## ADR-029 - Marketplace performance is budgeted at build and verified at delivery

Status: Accepted.

Marketplace performance changes must preserve the editorial bookstore hierarchy, accessibility contracts, stable API pagination, Auth/favorite behavior, and image lifecycle. Decorative card/reveal motion uses CSS under the global reduced-motion contract instead of shipping a general animation runtime. Static home content remains server-rendered; data shelves are small client islands and may share one in-flight public listing request without merging unrelated presentation back into a page-wide client boundary. Route and segment fallbacks retain the final heading and approximate geometry so streaming does not remove page identity or create avoidable layout movement.

Persisted public covers use the Next image optimizer with explicit responsive size contracts, lazy loading unless they are the primary detail image, and a narrow allowlist limited to HTTPS Supabase hosts at `/storage/v1/object/public/listing-images/**`. The standard cover quality is 72 and detail thumbnails may use 65. Browser-local blob/data authoring previews remain raw because they never leave the browser and cannot be optimized. A broad remote-image host/path, eager marketplace shelves, and raw persisted originals are rejected.

Every completed build must satisfy version-controlled gzip ceilings derived from the App Router manifests: shared runtime at most 105 KiB; home, catalog, and seller storefront at most 195 KiB each; listing detail at most 200 KiB. These ceilings are regression guards, not substitutes for user performance. The field targets are p75 LCP at most 2.5 seconds, CLS at most 0.1, and INP at most 200ms once production-capable RUM exists. Synthetic diagnostics and one laboratory run cannot prove those field targets. Representative database query plans now pass under ADR-030; production RUM and field evidence remain required before PERF-01 can pass, and ambiguous cold-stream CLS is recorded rather than averaged away.

Local browser verification keeps the full assertion set but caps Playwright at four fully parallel workers so a single development production server is not saturated by ten Chromium instances. Lower runner concurrency is a determinism boundary, not reduced product coverage.

## ADR-030 - Public marketplace readers are fixed, contained, and plan-verifiable

Status: Accepted.

Direct listing RLS remains the defense-in-depth contract for arbitrary table reads, but its seller-activity security barrier prevents several numeric and full-text client predicates from becoming index conditions. Public catalog and seller APIs therefore use fixed database readers whose complete query text is owned by migrations. The readers must reproduce rather than bypass the public visibility policy: catalog results are active only; seller inventory is active/sold only for the requested seller; both join a present, non-banned seller and return only safe public seller fields. Query, sort, cursor, maximum-price, seller, and page-size bounds are validated inside the database even though the API validates them first.

Privileged reader implementations live in the non-exposed `private` schema, are stable, have an empty `search_path`, and build dynamic catalog SQL only from fixed validated sort branches with all user values passed as parameters. The seller reader forces a custom plan for its optional cursor. The exposed `public` functions are `SECURITY INVOKER` wrappers that can only delegate to those fixed implementations; execute is granted explicitly to anonymous and authenticated roles, and no service-only or mutation authority is exposed. Direct listing RLS is not weakened or removed.

Newest and price cursors use row-value comparisons matching their composite index order instead of PostgREST disjunctions that degrade into post-index filtering. Azerbaijani full-text search uses the same `simple` configuration as the generated vector. A version-controlled development-only probe must exercise first/deep newest, both price directions, rare search, combined filters, seller inventory, and sold-review joins against representative data with `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`; assert required index participation, no avoidable ordered sort, bounded post-index filtering, anonymous visibility, input limits, and cleanup; re-analyze restored tables; and retain no fixtures. These plans are regression evidence, not production latency or field-Web-Vitals claims.

## ADR-031 - Marketplace RUM is opt-in, grouped, and identity-free

Status: Accepted and implemented; production field evidence pending.

Use Next's built-in `useReportWebVitals` in one isolated client component rather than adding an external analytics dependency before DR-008/DR-009 are resolved. The reporter and same-origin endpoint remain inert unless `WEB_VITALS_ENABLED=true` is configured at build and runtime. Activation is a production operation that also requires an authorized target, named log/metrics owner, retention decision, and representative traffic; local or synthetic events never count as field p75 evidence.

Collect only the three Core Web Vitals required by ADR-029: LCP, CLS, and INP. Only four public marketplace route groups are eligible: home, catalog, listing detail, and seller storefront. Dynamic listing/seller identifiers are replaced with their group before transport. Private routes, authoring/editing paths, raw URLs, query strings, metric/page-load IDs, performance entries or attribution selectors, referrers, account/session identifiers, user-authored content, device/network details, and geography are excluded. The payload schema is versioned and contains only metric name, finite bounded value, route group, and navigation type.

The first-party endpoint requires a same-origin browser context, accounting for forwarded public host/protocol behind an internal Next runtime URL; accepts strict JSON no larger than 1 KiB; rejects extra or out-of-range fields; applies the current request throttle; and returns a no-store 204 after emitting one structured `bookswap.web_vital` record. The server may add only a threshold rating derived from ADR-029. Application-authored logs cannot include IP, request headers, raw paths, or reader identifiers. The current in-process throttle and platform log availability do not replace P1-013's durable abuse/monitoring decisions.

Production evaluation must preserve individual metric samples so mobile and desktop p75 distributions can be computed per route group. Passing requires LCP at most 2.5 seconds, CLS at most 0.1, and INP at most 200ms at p75 for representative production traffic. Until that evidence exists, PERF-01 remains Partial even when the instrumentation, transport, logs, bundles, and local browser matrix pass.

## ADR-032 - Public marketplace success responses are validated before render

Status: Accepted.

HTTP success is not sufficient evidence that a public marketplace payload is safe to render. Home/catalog pages, listing detail/reviews, and seller storefront pages validate their complete render-critical response shapes before committing client state. The shared boundary requires listing identity/text/finite price/known state/safe seller fields, string image arrays, finite counts and timestamps, bounded review ratings, array collections, and opaque string-or-null cursors. Optional fields remain optional where the domain permits them, nullable review authors remain safe, and unknown passthrough fields do not change the public wire contract.

Non-OK responses, invalid JSON, and malformed success bodies degrade to the existing Azerbaijani initial or load-more unavailable state. Provider bodies, parser diagnostics, and malformed values are never presented to readers, and a malformed success must not become a React client exception. This client boundary complements server validation; it does not redefine API responses, excuse invalid server output, or hide failures from deterministic tests. Every public response-shape change must update the parser, all consumers, focused valid/invalid unit cases, and production-browser failure injection together.
