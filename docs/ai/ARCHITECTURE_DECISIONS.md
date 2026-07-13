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

Status: Proposed, launch-required.

Each physical-copy offer is sale, exchange, or both. Price is required only when sale is enabled. Negotiability is separate. Desired exchange titles are structured preferences with a free-text fallback. Existing sale listings migrate to sale intent without data loss.

## ADR-007 — Privacy-preserving exchange matching

Status: Proposed, launch-required.

Match candidates are computed from offered/owned and wanted title identities plus eligible public listing state. Return only public listing/profile data and approximate location. Never expose private shelves, exact location, contact information, or a user's full wanted graph. Users explicitly initiate chat; dismissal/block/report suppresses future suggestions.

## ADR-008 — Azerbaijani-first localization

Status: Accepted direction; implementation incomplete.

Adopt Azerbaijani as the default locale and document language while preserving user-entered Azerbaijani/Russian/English book data. Centralize UI strings and locale-aware number/date/metadata formatting before translating piecemeal. English-only current routes remain foundation code, not launch-complete localization.

## ADR-009 — Preserve the established visual system

Status: Accepted.

Fraunces/Manrope, warm ivory/walnut/paper palette, restrained gold, shelves, cards, cover fallbacks, header/footer, state vocabulary, focus visibility, and reduced motion are protected. References may influence workflows but not visual replacement. Accessibility and responsive refinements must be targeted and evidence-backed.

## ADR-010 — Stable cursor pagination

Status: Proposed, launch-required.

Replace fixed-limit catalog retrieval with opaque cursor pagination using a deterministic sort tuple. Newest uses (created_at, id); price sorts include price plus a deterministic tie-breaker. Filters and sort are part of cursor validity. Responses provide items and nextCursor; no duplicates or gaps under normal concurrent inserts.

## ADR-011 — Protected Realtime only

Status: Accepted.

Messages and notifications may use RLS-protected Postgres Changes subscriptions, which the current active chat UI already uses. Any Broadcast channel carrying private data must be private and authorized through realtime.messages policies. Remove redundant public room broadcasts rather than maintaining two delivery paths.

## ADR-012 — No integrated payment or controlled shipping yet

Status: Accepted.

The platform supports discovery, conversation, and user-arranged local handoff/optional delivery. It must not claim escrow, payment protection, delivery guarantees, insurance, or verified condition. Payment/shipping integration requires a separate legal, operational, and technical decision.

## ADR-013 — Durable product evidence

Status: Accepted.

The acceptance matrix is the definition of done. Project state records facts, issue queue records work, QA evidence records commands and behavior, iteration log records chronology/ownership, and decision requests contain only unresolved external/product choices. No final completion report exists until every launch gate passes.

## ADR-014 — Resolve public profile grants without widening private data

Status: Proposed, P0.

Current column-level public grants protect email, phone, banned, and is_admin, but the catalog's PostgREST embedded users relation requires table SELECT and returns permission denied. The fix must preserve private columns. Candidate designs include a deliberately public profile table/view with safe grants and RLS or an RPC/query shape that never requires broad users SELECT. Do not grant all users columns to anon as a shortcut.
