# BookSwap project state

Updated: 30 July 2026

## Current verdict

**The clean friends-only beta backend and repository are launch-capable; friend self-service Auth is blocked only by external transactional email configuration.** The owner-created `bookswap-beta` project is separate from the paused legacy project and the development project. All 22 immutable migrations, hosted Auth URL/password settings, Storage configuration, SQL gates, and the seven-role authorization matrix pass there with zero fixture residue. Vercel Production now has the five required beta variables by name/scope, but the current deployment still predates this release. Supabase's default Auth mail service cannot support arbitrary friend addresses; a custom SMTP provider or Send Email Hook must be configured and verified before invitations are sent. The encrypted backup/restore rehearsal remains an owner-accepted private-beta deferral, not this blocker. Public launch additionally remains blocked by recovery evidence, legal facts, administrator MFA/hosted controls, operations ownership, and post-deploy evidence.

## Authoritative repository and Git baseline

- Authoritative repository: the current BookSwap GitHub checkout
- Clean beta provisioning started from synchronized, clean `main` at `147fc794736ea72e6cf215dcfd5b18c9fefa17ad`.
- The owner authorizes focused repository commits/push and a controlled deployment only if every compatibility and safety gate passes. Backup/restore retry, production history repair, and risky production migrations are not authorized.

## Launch product scope

The MVP is an Azerbaijani-first used-book marketplace for listing, discovering, selling, and buying books. Launch-critical flows are Auth, listings, search/filter, protected image upload, favorites, buyer/seller chat, sold/relist lifecycle, eligible reviews, reports, notifications, privacy requests, moderation/admin controls, safety/legal pages, and stable error behavior.

Normal-user listings and messages are free at launch. There is no commission, integrated payment, VIP listing, subscription, or display advertising. Paid listing promotion, professional seller plans, and direct sponsorships are unimplemented future candidates, not launch promises.

Automated exchange matching, wanted-title matching, reader shelves, social reading, and advanced edition/bibliographic intelligence are post-launch. A `sale/exchange/both` model was not added because the current schema/UI coherently implement sale and the public promise does not claim an automated exchange platform.

## Implemented launch-readiness work

- Correct development Supabase public identity with fail-fast project guard and an ignored local test credential boundary; no secret is tracked or documented.
- Two additive migrations (22 total) for validation constraints, privacy uniqueness, report/review/chat invariants, Azerbaijani search normalization, service-only Storage mutations, durable atomic rate limiting, Azerbaijani moderation notifications, and explicit private-table ACL posture.
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

## Development Supabase status

- The guarded authorization environment is a dedicated, healthy non-production project.
- Public local URL/key: correct and guarded; ignored `.env.local` is not committed
- Service-role test key: available only in ignored `.env.test.local`; verified as `service_role` for the intended project and not committed
- Remote migrations: 22, including both 28 July hardening migrations; their stored SQL fingerprints match all repository files, but their remote timestamp versions were generated independently of repository filenames
- Data: temporary authorization fixtures were cleaned; no production data was used
- Security Advisor after migration: zero findings
- Structural SQL: public tables without RLS = 0; launch constraints/indexes present; browser Storage mutation policies = 0; anon/authenticated rate-RPC execute = false; service-role execute = true; fixed search path present
- Real limiter behavior: allow/allow/deny at threshold 2; retry value valid; fixture removed
- Generated TypeScript type for `consume_rate_limit`: matches `lib/database.types.ts`

PostgreSQL 17 clients and Docker Desktop are now installed outside the repository, and the Docker 29.6.2 engine is reachable through its user-local CLI. A fresh local reset applied all 22 migrations plus seed on PostgreSQL 17; `launch_readiness.sql`, the corrected representative query-plan gate, local schema lint, migration count, and fixture cleanup all pass. The local stack was then stopped and its generated metadata removed.

## Clean beta production infrastructure

- The owner-designated beta database, legacy database, and development database are three distinct PostgreSQL 17 projects. The legacy project remains paused and untouched; no legacy Auth user, database row, Storage object, or migration history was copied.
- The clean beta project received exactly the repository's 22 migrations in filename order. Migration history matches 22/22; the seed was not applied.
- Hosted beta evidence: 13 public application tables all have RLS, required constraints/indexes/triggers/extensions are present, browser Storage mutation policies are zero, the public `listing-images` bucket is limited to 5 MiB JPEG/PNG/WebP, and Security Advisor returns zero findings.
- `launch_readiness.sql`, schema lint, and all eight representative query plans pass remotely. The query-plan fixtures, seven-role authorization fixtures, one immutable test audit row, Auth users, application rows, limiter rows, and Storage objects were all returned to zero.
- Hosted Auth has the canonical HTTPS Site URL, only the three required exact redirect URLs, 12-character minimum, letters/digits requirement, confirmation enabled, secure password change, refresh rotation, and configured rate limits. Friend email delivery still requires external custom SMTP/Send Email Hook configuration.
- The currently published Vercel release is `READY` but predates this release and is not accepted as the beta build. Vercel Git remains disconnected.
- The paused legacy project remains non-disposable. Blind migration pushes, migration-history edits without exact review, every reset, and any data migration remain prohibited.
- Default `supabase db dump` excludes managed `auth` and `storage` schemas. No logical archive/checksum, managed Auth recovery, encrypted off-project copy, or successful isolated restore exists. The owner has deferred that work for the friends-only beta while preserving it as mandatory before broad public launch, destructive/materially risky production migration, or meaningful real-user data accumulation.
- The local Supabase CLI, PostgreSQL 17 tools, Docker engine, and encryption tool are available; the repository-external encrypted destination remains empty. No backup, restore, password prompt, or encrypted artifact was attempted in this run.
- Vercel Production has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, sensitive server-only `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, and `BOOKSWAP_PRIVATE_BETA` by name/scope. They target the verified clean beta project, not development or legacy; no value was printed.
- The installed client path returned 403 HTML for the modern secret-key format but 200 JSON for the repository-compatible legacy `service_role` key. Vercel therefore uses the active legacy `anon`/`service_role` pair; the service key remains server-only and sensitive.
- Alert routing, retention, uptime evidence, incident ownership, custom domain ownership, and post-deploy verification remain incomplete.
- Deployment gate result: **schema compatibility resolved by the clean beta project**. Production deployment and smoke remain to be recorded; friend invitations remain blocked on transactional Auth email delivery.

## Validation snapshot

- Strict TypeScript: pass
- Unit/adversarial tests: 62/62 pass
- Development environment identity and credential-role/project guard: pass without printing values
- Migration static check: 22 migrations pass
- Production rehearsal static guard: all 22 normalized fingerprints pass; read-only SQL/runbook required; zero backup artifacts in repository
- Dependency baseline: 7/7 pinned security versions pass; the live production-only npm audit is 0, while the full development tree has 13 high findings that all trace to one newly published `brace-expansion` denial-of-service advisory in the ESLint-only toolchain. No compatible 1.x fix exists yet; the known development-only path is guarded and does not block launch.
- Secret scan: pass after project-identifier sanitization and backup-artifact cleanup
- Local and development database structural/behavioral checks: pass; local 22/22 migration reset, two SQL gates, schema lint, and zero query-plan fixture residue
- Format/lint/strict TypeScript: pass
- Production build: pass, 39/39 static pages generated
- Bundle budgets: 5/5 pass
- Chromium browser/E2E: 30/30 pass with the private-beta marker/noindex check; exact beta reflow coverage includes 320, 375, 1024, and 1440 px widths
- Real multi-actor backend authorization: 10/10 pass against both the guarded development project and the clean beta project; beta used seven roles and finished with zero Auth/application/Storage fixture residue
- Clean beta remote database: 22/22 migration parity; launch SQL pass; schema lint pass; 8/8 representative query plans pass; Security Advisor 0; performance notices are INFO-only unused indexes on an empty project

## Remaining external requirements

Private-beta promotion blocker:

1. configure and verify a custom SMTP provider or Send Email Hook for the clean beta Auth project so non-team friends can confirm signup and recover passwords; keep email confirmation enabled.

Owner-accepted private-beta deferrals:

- encrypted database/Auth/Storage backup and isolated restore rehearsal;
- final legal operator/contact/age/retention/counsel facts, provided the beta remains clearly labeled, invitation-only, and testers avoid sensitive or payment data.

Public-launch requirements still include those deferred items plus administrator MFA, leaked-password decision, alert/incident ownership, field performance, and completed production smoke evidence. Auth transactional email is not optional while email confirmation and recovery are in scope; CAPTCHA, product notification email, and telemetry remain optional.

Exact actions are in `docs/ai/DECISION_REQUESTS.md`; prioritized status is in `docs/ai/ISSUE_QUEUE.md`.
