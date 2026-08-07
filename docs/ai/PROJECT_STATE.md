# BookSwap project state

Updated: 7 August 2026

## Current verdict

**Not public-launch ready, and PR #7 is not deployed.** The 30 July clean-beta Production release, subsequent mobile listing-authoring fix, and MSG-001 messaging fix from `main` remain the established production behavior. PR #7 adds the owner-approved legal identity/contact, fail-closed public legal configuration, separate signup consent, legal-acceptance audit, consent withdrawal, and retained owner listing lifecycle. Migration 23 is applied and verified only on `bookswap-development`; clean beta and production have not received it. Qualified legal review, transactional Auth email, recovery/retention operations, provider-location and registration/address determinations, MSG-001 recipient confirmation, and a separately authorized migration/deployment gate remain open.

**MSG-001 is deployed to the canonical Production alias from `73d0628cd65372c8187198f847062814893cf9be` as Vercel deployment `dpl_ECZ6xdSzhgybz8Jj7Lx8wyDjS3j8`.** The exact deployment is `READY`; canonical HTTP, anonymous authorization, mobile Chromium route smoke, and runtime-error checks pass, with no production data, schema, RLS, grant, Auth, Storage, or environment mutation. The owner explicitly accepted the residual risk that a recipient-side manual smoke could not reach the protected candidate before promotion. Keep MSG-001 open until that recipient confirms on the canonical domain that the nullable-city conversation opens, the received message is visible, list-to-detail navigation works, and refresh remains correct.

## Authoritative repository and Git baseline

- Authoritative repository: the current BookSwap GitHub checkout
- Working branch: `autonomous/bookswap-product`; draft PR #7 merges current `origin/main` without rewriting published history.
- Clean beta provisioning started from synchronized, clean `main` at `147fc794736ea72e6cf215dcfd5b18c9fefa17ad`.
- Current conflict-resolution scope authorizes repository commit/push only. Deployment, backup/restore retry, production history repair, remote migration application, and infrastructure mutation are not authorized.

## Launch product scope

The MVP is an Azerbaijani-first used-book marketplace for listing, discovering, selling, and buying books. Launch-critical flows are Auth, listings, search/filter, protected image upload, favorites, buyer/seller chat, sold/relist lifecycle, eligible reviews, reports, notifications, privacy requests, moderation/admin controls, safety/legal pages, and stable error behavior.

Normal-user listings and messages are free at launch. There is no commission, integrated payment, VIP listing, subscription, or display advertising. Paid listing promotion, professional seller plans, and direct sponsorships are unimplemented future candidates, not launch promises.

Automated exchange matching, wanted-title matching, reader shelves, social reading, and advanced edition/bibliographic intelligence are post-launch. A `sale/exchange/both` model was not added because the current schema/UI coherently implement sale and the public promise does not claim an automated exchange platform.

## Implemented launch-readiness work

- Centralized exact legal identity/contact and `2026-08-07` document version across Terms, Privacy, Marketplace/Community Rules, footer, and signup; private beta tolerates missing identity while public configuration fails closed for empty, whitespace-only, `[EMAIL]`, and `{{LEGAL_CONTACT_EMAIL}}` contact values.
- Two separate unchecked signup affirmations and a trusted Auth flow carrying exact versions/consents to an additive `legal_acceptances` audit contract with database identity/time, own-row read-only RLS, and no normal-user mutation grant.
- Explicit privacy-request support for consent withdrawal; provider/storage audit records Supabase and Vercel, conditional transactional email, same-origin operational Web Vitals, and no non-essential tracking/banner.
- Owner-only `Satıldı`, `Yenidən satışa çıxar`, and `Elanı sil` actions with explicit Azerbaijani confirmations, idempotent mutation guards, sold catalog/chat behavior, and retained removal through the existing hidden `locked` state. Owner removal preserves the listing row, images, chat/messages, reviews, reports, and moderation evidence instead of invoking cascade delete or Storage cleanup.

- Correct development Supabase public identity with fail-fast project guard and an ignored local test credential boundary; no secret is tracked or documented.
- Twenty-three immutable migrations cover validation constraints, privacy uniqueness, report/review/chat invariants, Azerbaijani search normalization, service-only Storage mutations, durable atomic rate limiting, Azerbaijani moderation notifications, explicit private-table ACL posture, and the legal-acceptance audit/consent-withdrawal contract.
- Postgres-backed HMAC-keyed limiter across Auth API, listing/upload/chat/favorite/report/review/notification/profile/privacy/admin/moderation actions; stable 429/503 and retry behavior.
- Strict server ownership/state checks, bounded chat history/input, stale-account rejection, duplicate privacy handling, safe account-mutation response boundaries, and correlation IDs.
- Structured provider-neutral logging without raw provider errors, full private messages, authorization material, or unnecessary personal data.
- 12-character password UI/local policy, generic Auth/reset errors, safe redirects, session revalidation, and no client role trust.
- Azerbaijani-first notification fallback, number/currency/date behavior, Auth/listing/chat/report/review/admin/privacy copy, localized seed content, and search handling for dotted/dotless I.
- Azerbaijani launch drafts for Terms, Privacy, Marketplace Rules, Safety, prohibited content, reporting/moderation, appeals, participant transaction responsibility, minors placeholder, account deletion/privacy, and accessible footer/sitemap links.
- Local Supabase Postgres 17 config, repeatable static migration check, transactional SQL launch test, guarded real-backend authorization suite, dependency baseline, and repository secret scan.
- Provider-neutral monitoring/incident guidance plus backup, restore, forward-fix, Vercel rollback, Storage, secret-rotation, and failed-release procedures.
- Sanitized production inventory, exact legacy migration fingerprints, an ordered 22-migration risk classification, read-only precondition SQL, immutable fingerprint guard, and a backup/restore/reconciliation runbook. These are preparation, not recovery evidence.
- AI-free content safety: deterministic boundary validation, one narrow credential-theft text rule, durable rate limits, existing upload checks, user reporting, admin review/removal/ban/audit, and no external content-classification request. Image content is not claimed to be semantically understood.
- P0 mobile listing resilience: guarded object-URL preview creation/revocation in create and edit flows, explicit Azerbaijani HEIC/HEIF and size validation, duplicate-submit protection, caught Auth lookup rejection, and an authoring-scoped client error boundary.
- Messaging response resilience: nullable optional participant cities match the database contract; transient detail failures expose an Azerbaijani retry action, expired sessions expose sign-in recovery, and genuine missing/unauthorized rooms retain the non-enumerating unavailable state.

## Development Supabase status

- The guarded authorization environment is a dedicated, healthy non-production project.
- Public local URL/key: correct and guarded; ignored `.env.local` is not committed
- Service-role test key: available only in ignored `.env.test.local`; verified as `service_role` for the intended project and not committed
- Remote migrations: exactly 23; the final entry is `add_legal_acceptance_audit`
- Data: Auth/users/listings/chat/messages/reviews/reports/privacy/notification/legal-acceptance fixtures, four orphaned test moderation rows, and 24 test rate-limit rows were removed. Four test-only administrator audit rows remain because the immutable audit trigger correctly rejects deletion; it was not bypassed.
- Security Advisor after migration 23: zero findings
- Performance Advisor on the current development schema: 11 informational unused-index findings and no warning/error finding
- Structural SQL: public tables without RLS = 0; launch constraints/indexes present; browser Storage mutation policies = 0; anon/authenticated rate-RPC execute = false; service-role execute = true; fixed search path present
- Real limiter behavior: allow/allow/deny at threshold 2; retry value valid; fixture removed
- Fresh remote-generated types include the exact eight-column `legal_acceptances` row shape and match the repository's generated-shaped row contract. Repository `Insert`/`Update` remain intentionally narrowed to `never` to mirror the verified no-mutation ACL rather than weakening the application type boundary.

PostgreSQL 17 clients and Docker Desktop are installed outside the repository. On 30 July, a fresh local reset applied the then-current 22 migrations plus seed and passed launch SQL, query-plan, lint, migration-count, and cleanup gates before teardown. Migration 23 has dedicated-development and static verification; a fresh local 23-migration reset has not been claimed.

## Clean beta production infrastructure

- The owner-designated beta database, legacy database, and development database are three distinct PostgreSQL 17 projects. The legacy project remains paused and untouched; no legacy Auth user, database row, Storage object, or migration history was copied.
- The clean beta project received exactly the repository's 22 migrations in filename order. Migration history matches 22/22; the seed was not applied.
- That 22-migration statement is historical clean-beta production evidence. Migration 23 from PR #7 has not been applied to clean beta or production.
- Hosted beta evidence: 13 public application tables all have RLS, required constraints/indexes/triggers/extensions are present, browser Storage mutation policies are zero, the public `listing-images` bucket is limited to 5 MiB JPEG/PNG/WebP, and Security Advisor returns zero findings.
- `launch_readiness.sql`, schema lint, and all eight representative query plans pass remotely. The query-plan fixtures, seven-role authorization fixtures, one immutable test audit row, Auth users, application rows, limiter rows, and Storage objects were all returned to zero.
- Hosted Auth has the canonical HTTPS Site URL, only the three required exact redirect URLs, 12-character minimum, letters/digits requirement, confirmation enabled, secure password change, refresh rotation, and configured rate limits. Friend email delivery still requires external custom SMTP/Send Email Hook configuration.
- The controlled Vercel CLI release launched from the clean, synchronized `a7a5a68` checkout is `READY`, targets Production, and owns the canonical HTTPS alias. Vercel Git remains disconnected. CLI deployment metadata does not contain a Git source SHA, so the source attribution is the recorded clean-checkout preflight rather than a provider-embedded commit field.
- The paused legacy project remains non-disposable. Blind migration pushes, migration-history edits without exact review, every reset, and any data migration remain prohibited.
- Default `supabase db dump` excludes managed `auth` and `storage` schemas. No logical archive/checksum, managed Auth recovery, encrypted off-project copy, or successful isolated restore exists. The owner has deferred that work for the friends-only beta while preserving it as mandatory before broad public launch, destructive/materially risky production migration, or meaningful real-user data accumulation.
- The local Supabase CLI, PostgreSQL 17 tools, Docker engine, and encryption tool are available; the repository-external encrypted destination remains empty. No backup, restore, password prompt, or encrypted artifact was attempted in this run.
- Vercel Production has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, sensitive server-only `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, and `BOOKSWAP_PRIVATE_BETA` by name/scope. They target the verified clean beta project, not development or legacy; no value was printed.
- The installed client path returned 403 HTML for the modern secret-key format but 200 JSON for the repository-compatible legacy `service_role` key. Vercel therefore uses the active legacy `anon`/`service_role` pair; the service key remains server-only and sensitive.
- Alert routing, retention, uptime evidence, incident ownership, custom-domain ownership, and representative field performance remain incomplete.
- Deployment gate result: **schema compatibility, production deployment, and public read-only smoke pass on the clean beta project**. Friend invitations remain blocked on transactional Auth email delivery.

## Paused legacy production boundary

- The paused legacy database is distinct from clean beta and development, remains non-disposable, and has not received PR #7 or the later hardening migration set.
- Its reviewed legacy fingerprints and reconciliation runbook are preparation only. Blind migration pushes, history edits without exact review, resets, and data migration remain prohibited.
- Backup availability, encrypted export, managed Auth recovery, Storage backup, and successful isolated restore evidence remain incomplete; no new legacy mutation is authorized.

## Validation snapshot

- Strict TypeScript: pass
- Unit/adversarial tests: 74/74 pass after the PR #7 semantic merge
- Development environment identity and credential-role/project guard: pass without printing values
- Migration static check: 23 migrations pass
- Dependency patched-version baseline: 7/7 pass
- Secret scan: 201 repository files pass
- Development database structural/behavioral checks: pass
- Format/lint/strict TypeScript: pass
- Production build: pass, 39/39 static pages generated
- Bundle budgets: 5/5 pass
- Browser/E2E: Chromium 37 pass with one expected private-beta-only skip; mobile WebKit 5/5 pass. Coverage includes owner lifecycle, current legal consent, mobile listing authoring, nullable-profile messaging, keyboard/focus/contrast/reflow, and signed-out security states.
- Real multi-actor backend authorization: 14/14 pass against the guarded development project, covering confirmation-link signup/trigger/audit, incomplete-consent rejection, own/cross-user RLS, consent withdrawal, sold/catalog/chat/relist behavior, retained removal, and history/image-cleanup invariants
- Production rehearsal static guard: all 23 normalized migration fingerprints pass, including the unchanged appended legal-acceptance migration; read-only SQL/runbook required; zero backup artifacts in repository
- Dependency baseline: 7/7 pinned security versions pass; the live production-only npm audit is 0, while the full development tree has 13 high findings that all trace to one newly published `brace-expansion` denial-of-service advisory in the ESLint-only toolchain. No compatible 1.x fix exists yet; the known development-only path is guarded and does not block launch.
- Clean beta remote database: 22/22 migration parity; launch SQL pass; schema lint pass; 8/8 representative query plans pass; Security Advisor 0; performance notices are INFO-only unused indexes on an empty project
- Canonical production browser smoke: 6/6 public routes, 8/8 responsive route-width checks, 29 successful asset responses, catalog API/robots/manifest/security headers pass, real failed requests 0, console errors 0, page errors 0, unexpected HTTP failures 0
- Vercel post-deploy observability: runtime error clusters 0; sampled production statuses are 200/304 plus the smoke gate's expected 400 validation probes; 5xx 0

## Remaining external requirements

Private-beta promotion blocker:

1. configure and verify a custom SMTP provider or Send Email Hook for the clean beta Auth project so non-team friends can confirm signup and recover passwords; keep email confirmation enabled.

Owner-accepted private-beta deferrals:

- encrypted database/Auth/Storage backup and isolated restore rehearsal;
- qualified counsel, retention enforcement, provider-location and any required registration/address determinations, provided the beta remains clearly labeled, invitation-only, and testers avoid sensitive or payment data.

Public-launch requirements still include those deferred items plus administrator MFA, leaked-password decision, alert/incident ownership, field performance, and completed production smoke evidence. Deploying PR #7 additionally requires separately authorized migration-23 promotion and compatibility verification. Auth transactional email is not optional while email confirmation and recovery are in scope; CAPTCHA, product notification email, and telemetry remain optional.

Exact actions are in `docs/ai/DECISION_REQUESTS.md`; prioritized status is in `docs/ai/ISSUE_QUEUE.md`.
