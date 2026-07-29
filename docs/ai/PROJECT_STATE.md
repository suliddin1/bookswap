# BookSwap project state

Updated: 29 July 2026

## Current verdict

**Not production-ready; conditionally non-deployment ready.** All identified safe repository-side launch-critical work is implemented, and the guarded real development authorization matrix passes. The remaining non-deployment launch blocker is owner/counsel-supplied legal facts and approval. A production backup/migration rehearsal inspection on 29 July established the exact legacy history baseline and classified all 22 immutable migrations, but stopped before backup because no restorable export, managed Auth recovery, encrypted destination, or isolated restore could be produced in this environment. Hosted Auth settings, required environment values, operational ownership, and post-deploy verification also remain incomplete. External AI/moderation credentials are not part of the product or launch gate.

## Authoritative repository and Git baseline

- Authoritative repository: the current BookSwap GitHub checkout
- The rehearsal evidence was prepared on a focused branch from a synchronized, clean `main` baseline.
- Publishing or merging the documentation does not authorize deployment, Vercel Git reconnection, backup/restore execution, or any production mutation.

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

Local `supabase db reset` remains unexecuted on this workstation because Docker/Podman and `psql` are absent. `supabase/config.toml`, corrected seed ordering, and `supabase/tests/launch_readiness.sql` are prepared. The actual migrations were nevertheless executed successfully on the authorized empty development backend.

## Observed production infrastructure gate

- The intended production database and hosting projects are separate from the guarded development environment.
- The currently published release predates the launch-readiness branch. Vercel Git remains disconnected, no custom launch domain is verified, and this repository change does not promote a release.
- Production contains two legacy history rows whose SQL fingerprints exactly match repository migrations 1 and 3. Migration 2 is unrecorded but its objects are already represented by the exact legacy initial schema. Migrations 4–22 are absent from production. This evidence supports a history-only baseline repair followed by 19 ordered migrations, but only after the same sequence passes on an isolated restore.
- Sanitized aggregate inventory found a small legacy baseline with internally consistent Auth/profile state, no observed migration-precondition conflicts, and no Storage object content at inspection time. These observations lower data-conflict risk but do not replace a backup or maintenance-window rehearsal.
- Production remains non-disposable. Blind migration pushes, migration-history edits without exact review, and every production reset are prohibited.
- Storage ownership policy alignment, hosted authentication configuration, administrator MFA, leaked-password protection, network controls, and email delivery require owner verification.
- Default `supabase db dump` excludes managed `auth` and `storage` schemas. No logical archive/checksum, managed Auth recovery, encrypted off-project copy, or successful isolated restore exists. A zero-object Storage observation is inventory only, not a completed backup. No migration may proceed until the recovery gate is satisfied.
- The rehearsal environment lacked the required Supabase/PostgreSQL tooling, secure database connection, approved encrypted destination, and approved clean restore target. The existing development environment was not authorized for reset/reprovision and was not used as a restore target.
- Production environment variables must be verified by name, scope, and role without copying values into public records. Listing and chat safety require no external AI key.
- Alert routing, retention, uptime evidence, incident ownership, canonical domain, and post-deploy verification remain incomplete.
- Deployment gate result: **failed safely**. No migration, Auth/Storage setting change, environment mutation, Git reconnection, production deployment, production authorization fixture, or rollback was performed.

## Validation snapshot

- Strict TypeScript: pass
- Unit/adversarial tests: 59/59 pass
- Development environment identity and credential-role/project guard: pass without printing values
- Migration static check: 22 migrations pass
- Production rehearsal static guard: all 22 normalized fingerprints pass; read-only SQL/runbook required; zero backup artifacts in repository
- Dependency baseline: 7/7 pinned security versions pass; the live production-only npm audit is 0, while the full development tree has 13 high findings that all trace to one newly published `brace-expansion` denial-of-service advisory in the ESLint-only toolchain. No compatible 1.x fix exists yet; the known development-only path is guarded and does not block launch.
- Secret scan: 192 repository files pass
- Development database structural/behavioral checks: pass
- Format/lint/strict TypeScript: pass
- Production build: pass, 39/39 static pages generated
- Bundle budgets: 5/5 pass
- Chromium browser/E2E: 29/29 pass, including isolated authenticated privacy hydration readiness and cross-identity profile/privacy coverage
- Real multi-actor backend authorization: 10/10 pass against the guarded development project; temporary fixtures cleaned

## Remaining external requirements

Launch blockers:

1. owner supplies legal identity/contact/age/retention/appeal facts, replaces placeholders, and obtains qualified counsel approval.

Production/deployment-only requirements include a complete database/Auth/Storage backup and measured isolated restore, migration-history reconciliation rehearsal, project/domain/environment configuration, Auth dashboard controls and leaked-password decision, admin MFA enforcement, alert routing, field performance, deployment, and production smoke/authorization verification. Optional email/CAPTCHA/telemetry services may remain disabled.

Exact actions are in `docs/ai/DECISION_REQUESTS.md`; prioritized status is in `docs/ai/ISSUE_QUEUE.md`.
