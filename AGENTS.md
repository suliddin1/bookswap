# BookSwap repository guidance

This file governs autonomous work in D:\Codex Projects\2HandedBook. The separate checkout D:\GitHub\BookSwap is outside scope: never read from it, copy from it, synchronize with it, or modify it.

## Product and repository map

BookSwap is an Azerbaijani-first marketplace for selling and exchanging physical books. Preserve the existing implementation and its warm bookstore identity.

- app/: Next.js App Router pages, route handlers, metadata, and global styles.
- components/: client-facing product surfaces and shared presentation.
- hooks/: browser authentication, listings, chat, and notification state.
- lib/: API validation, authorization, Supabase clients, generated-shaped database types, normalization, security, and shared domain types.
- supabase/migrations/: ordered database contracts. Apply strictly by filename order.
- supabase/functions/: Supabase Edge Functions.
- tests/: Vitest API tests and Playwright browser smoke tests.
- public/: static product assets.
- docs/ai/: durable scope, decisions, state, issues, acceptance criteria, and evidence.

Read docs/ai/PROJECT_STATE.md and docs/ai/ISSUE_QUEUE.md before selecting work. Map every change to docs/ai/ACCEPTANCE_MATRIX.md and append evidence to docs/ai/QA_EVIDENCE.md and docs/ai/ITERATION_LOG.md.

## Protected architecture and contracts

- Keep Next.js App Router and the existing single-application structure unless an accepted architecture decision explicitly replaces it.
- Keep service-role credentials server-only. Browser code may receive only public Supabase configuration.
- Treat route-handler authorization, RLS, grants, Storage policies, Realtime authorization, and database constraints as layered controls; one layer never substitutes for another.
- Validate untrusted inputs at the HTTP boundary with Zod or an equivalently explicit schema.
- Derive identity and privileges from verified Auth state and public.users, never from editable user metadata.
- Preserve the separation between public reads and authenticated server mutations until a reviewed decision changes it.
- Database migrations are append-only after application. Never edit an applied migration to simulate a fix; add a later migration.
- Regenerate database types from the target schema after schema changes, review the diff, and validate all consumers.
- Preserve response shapes used by components and hooks or migrate every consumer in the same change.

## Coding conventions

- Use strict TypeScript. Avoid any, non-null assertions, and type casts that conceal missing validation.
- Prefer Server Components by default; add client boundaries only where browser state or effects are required.
- Keep route handlers thin: parse, authorize, call a domain operation, return a stable response.
- Use explicit ownership and state checks on every service-role query before reading or mutating user data.
- Await durable side effects that must complete, or move them to a verified durable job mechanism.
- Use accessible semantic HTML, visible labels, keyboard operation, and clear focus states.
- Keep optional book metadata optional. Fast listing creation is a product constraint.
- Use npm and the committed package-lock.json. Do not introduce a second package manager.

## Required validation

Run the smallest relevant checks while iterating and all of these before claiming a completed slice:

    npm run lint
    npx tsc --noEmit --incremental false
    npm test
    npm run build
    npm run test:e2e

For database work, additionally apply migrations to an authorized non-production project, inspect schema/constraints/indexes/triggers/grants/RLS/Storage/Realtime, regenerate types, run Supabase security and performance advisors, and exercise the affected authorization behavior with at least two users when possible.

## Git safety

- Work only on autonomous/bookswap-product unless the user directs otherwise.
- Inspect status and diff before and after every slice. Preserve unrelated user changes.
- Never use destructive reset, clean, checkout, or restore operations to discard work.
- Never push, deploy, merge, rebase, or rewrite history without explicit authorization.
- Checkpoint coherent work locally with an intentional commit after validation.
- Environment files, credentials, node_modules, .next, caches, test-results, Playwright artifacts, coverage, screenshots, build output, and editor artifacts must not enter Git.
- Store transient browser evidence under an ignored artifact directory such as test-results.

## Supabase security rules

- Production databases are off-limits unless the user explicitly authorizes a named production action.
- Use a separate development project or local stack for migrations and destructive tests.
- Never log, document, commit, or send a service-role/secret key to the browser.
- RLS must be enabled on every exposed table, with policies scoped to named roles and explicit ownership/state predicates.
- Review SQL name resolution carefully. Qualify outer and inner columns in policies to prevent ambiguous references becoming tautologies.
- Pair RLS with least-privilege table and column grants; verify application queries through PostgREST, because catalog-level correctness does not prove API compatibility.
- Storage writes and deletes must enforce bucket and authenticated owner-folder rules. Deleting/replacing a listing must define object cleanup behavior.
- Use protected Postgres Changes subscriptions or private Realtime channels. Never broadcast private room data on a public channel.
- Keep privileged security-definer functions non-callable by public roles, schema-qualify objects, and set a safe search_path.
- Run the Supabase advisors after every DDL change and record findings.

## Azerbaijani localization

- Azerbaijani is the default product language and document language marker. Use correct Azerbaijani characters and natural local terminology.
- Support Azerbaijani, Russian, and English book metadata without transliterating user content.
- Use AZN for prices and Azerbaijani cities/regions for location filters. Do not assume US addresses, tax, payments, shipping, or protection.
- Provide user-facing fallback/error/validation/legal text in Azerbaijani before launch. Do not mix languages within one flow without an intentional locale switch.
- Dates, numbers, pluralization, metadata, Open Graph content, manifest, sitemap, and document lang must follow the active locale.

## UI preservation

- Preserve Fraunces and Manrope; walnut, ivory, paper, near-black, brown, and restrained gold; the warm bookstore atmosphere; shelf catalog; book-cover fallbacks; card language; header/footer; responsive grid; and established loading, empty, and error vocabulary.
- Preserve focus-visible styling and reduced-motion support.
- Make targeted changes only when evidence shows unreadable text, accessibility failure, unclear hierarchy, inconsistent tokens/spacing, broken responsiveness, unusable interaction, excessive glass effects, or a missing state.
- Do not copy PangoBooks, Vinted, Tap.az, or Lalafo branding, layouts, assets, or commercial models. Do not turn the product into a generic SaaS dashboard.

## Browser testing

- Exercise approximately 1440x900, 1024x768, 390x844, and 360x800.
- Check navigation, meaningful rendering, overflow, loading/empty/error states, console errors, failed requests, and HTTP errors.
- Core authenticated flows require separate buyer, seller, and admin identities; verify forbidden cross-account actions, banned-user behavior, and signed-out behavior.
- Verify keyboard flow, visible focus, labels, contrast, touch targets, zoom/reflow, and reduced motion for affected surfaces.
- A page returning 200 is not a pass when its core API fails or only an error state renders.

## Ownership and conflict boundaries

Only one agent may edit a conflict-prone contract at a time. Announce ownership in docs/ai/ITERATION_LOG.md before starting and release it when the slice is complete.

- Database owner: supabase/migrations/, supabase/seed.sql, lib/database.types.ts.
- Security/API owner: lib/auth.ts, lib/security.ts, lib/supabase.ts, lib/api.ts, protected app/api/ routes.
- Shell/design owner: app/layout.tsx, app/globals.css, components/site-header.tsx, components/site-footer.tsx, Tailwind configuration.
- Dependency owner: package.json, package-lock.json, Next/TypeScript/ESLint/Playwright configuration.
- Shared domain owner: lib/types.ts, lib/marketplace.ts, lib/listings.ts, common API response contracts.

Parallel agents may work only in disjoint files with compatible acceptance criteria. Never edit the same migration, generated type file, auth/service-role path, lib/api.ts, lib/supabase.ts, app/layout.tsx, app/globals.css, navigation, package.json, or package-lock.json concurrently.

## Prohibited actions

- No broad redesign, greenfield rewrite, unrequested dependency migration, fabricated backend behavior, fake trust/payment/shipping claims, or broad feature implementation outside the selected acceptance slice.
- No production data changes, credential exposure, weakening RLS/grants/CSP for convenience, or client-side service-role use.
- No hidden swallowing of API/database errors and no “demo passed” success claim when an integration is absent.
- No completion claim based only on lint/build or mocked tests.
- No final completion report until all launch gates in the acceptance matrix pass with evidence.

## Completion conditions

A product slice is complete only when its acceptance rows pass, P0/P1 regressions are absent, migrations and types agree, relevant authorization cases are exercised, all required validation passes, browser evidence covers affected viewports/states, documentation is updated, and Git contains only intentional files. The product is launch-ready only when every launch-required row in docs/ai/ACCEPTANCE_MATRIX.md is Pass and no unresolved P0/P1 issue remains.
