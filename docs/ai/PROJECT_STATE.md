# BookSwap project state

Updated: 30 July 2026

## Current verdict

**Friends-only private-beta finalization is repository-ready but production promotion is blocked by application/schema incompatibility.** The owner has explicitly deferred the encrypted production backup/restore rehearsal and accepted that temporary recovery risk for the private beta; the backup is not itself classified as a private-beta blocker. The existing Vercel Production deployment is healthy but runs an older application commit. Current `main` requires schema contracts from migrations 4–22 that production does not have, including the catalog RPCs, chat-read state, cleanup/audit tables, and durable rate limiter. The immutable sequence also includes a documented lock/rewrite-sensitive generated-search-column rebuild, so neither those migrations nor current-code deployment can be treated as safe without the established migration gate. Public launch additionally remains blocked by recovery evidence, legal facts, hosted controls, operations ownership, and post-deploy evidence.

## Authoritative repository and Git baseline

- Authoritative repository: the current BookSwap GitHub checkout
- This finalization started from synchronized, clean `main` at `39108b7dd21724a91ad8d81ccf8fbf3ec2e96714`.
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

## Observed production infrastructure gate

- The intended production database and hosting projects are separate from the guarded development environment.
- The currently published release is `READY` but predates the launch-readiness work by 181 changed files. It is not accepted as the current private-beta release. Vercel Git remains disconnected.
- Production contains two legacy history rows whose SQL fingerprints exactly match repository migrations 1 and 3. Migration 2 is unrecorded but its objects are already represented by the exact legacy initial schema. Migrations 4–22 are absent from production. This evidence supports a history-only baseline repair followed by 19 ordered migrations, but only after the same sequence passes on an isolated restore.
- Sanitized aggregate inventory found a small legacy baseline with internally consistent Auth/profile state, no observed migration-precondition conflicts, and no Storage object content at inspection time. These observations lower data-conflict risk but do not replace a backup or maintenance-window rehearsal.
- Production remains non-disposable. Blind migration pushes, migration-history edits without exact review, and every production reset are prohibited.
- Storage ownership policy alignment, hosted authentication configuration, administrator MFA, leaked-password protection, network controls, and email delivery require owner verification.
- Default `supabase db dump` excludes managed `auth` and `storage` schemas. No logical archive/checksum, managed Auth recovery, encrypted off-project copy, or successful isolated restore exists. The owner has deferred that work for the friends-only beta while preserving it as mandatory before broad public launch, destructive/materially risky production migration, or meaningful real-user data accumulation.
- The local Supabase CLI, PostgreSQL 17 tools, Docker engine, and encryption tool are now available; the repository-external encrypted destination is empty. No backup, restore, password prompt, or encrypted artifact was attempted in this finalization run.
- Vercel Production has the Supabase URL, public key, and a non-readable sensitive server key by name/scope. Their URL targets the intended production project and not development. `NEXT_PUBLIC_SITE_URL` and the private-beta flag are not configured, and no environment value was printed.
- Alert routing, retention, uptime evidence, incident ownership, canonical domain, and post-deploy verification remain incomplete.
- Deployment gate result: **blocked safely on schema compatibility**. Deploying current code would make core catalog and protected mutation paths depend on missing production contracts; applying the full immutable migration sequence would cross the explicitly disallowed risky-migration boundary.

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
- Real multi-actor backend authorization: 10/10 pass against the guarded development project; temporary fixtures cleaned

## Remaining external requirements

Private-beta promotion blocker:

1. safely reconcile the production legacy history and supply the schema contracts required by current `main`; the required ordered migration set includes a materially risky step that this iteration may not apply without the separately restored recovery/change-control gate.

Owner-accepted private-beta deferrals:

- encrypted database/Auth/Storage backup and isolated restore rehearsal;
- final legal operator/contact/age/retention/counsel facts, provided the beta remains clearly labeled, invitation-only, and testers avoid sensitive or payment data.

Public-launch requirements still include those deferred items plus hosted Auth controls, administrator MFA, canonical domain, alert/incident ownership, field performance, and production smoke/authorization evidence. Optional email/CAPTCHA/telemetry services may remain disabled.

Exact actions are in `docs/ai/DECISION_REQUESTS.md`; prioritized status is in `docs/ai/ISSUE_QUEUE.md`.
