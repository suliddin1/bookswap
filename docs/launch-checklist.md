# Private-beta and public launch checklist

Updated: 1 August 2026

This document separates repository-prepared procedures from production facts that an owner must verify. A checked repository item is never evidence that production infrastructure is enabled.

## Friends-only private-beta boundary

- The owner has deferred encrypted backup/restore rehearsal and accepted that temporary recovery risk for this private beta. Do not request database/PAT secrets, enable temporary database access, reset passwords, dump, restore, or retry encryption in this run.
- The beta must be visibly labeled, remain direct-link/invitation-only, send `noindex`/`nofollow`, and warn testers to use test listings/messages without sensitive personal or payment data. `noindex` is not access control.
- Legal operator/contact/age/retention/counsel facts remain mandatory before broad public launch but do not independently block this clearly labeled friends beta.
- Backup/restore evidence becomes mandatory before broad public launch, destructive/materially risky production migrations, or meaningful real-user data accumulation.
- Deferral does not waive application/schema compatibility. Never deploy current code while production lacks its required contracts, and never apply a risky migration merely to unblock deployment.

## Repository-prepared release gate

- Run `npm ci`, `npm audit --omit=dev --audit-level=high`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:database:static`, `npm run test:dependencies`, `npm run test:secrets`, `npm run build`, `npm run test:performance`, and `npm run test:e2e`. Also inspect the full `npm audit` result: the current accepted residual is one development-only ESLint-chain advisory, not a general vulnerability-count allowance.
- With local Docker available, run `supabase db reset`, then execute `supabase/tests/launch_readiness.sql` and `supabase/tests/marketplace_query_plans.sql` with `psql -v ON_ERROR_STOP=1`.
- With the guarded development credentials, run `npm run test:authorization` and retain only pass/fail evidence—never credentials or private fixture content.
- Require zero Supabase Security Advisor findings. Treat unused-index notices on an empty development database as non-actionable until representative traffic exists.
- Require all legal placeholders to be replaced and counsel-reviewed before broad public launch. For friends beta, require the explicit beta warning and no sensitive/payment data.
- Inspect `git diff`, generated artifacts, ignored env files, and the final secret scan; commit locally only after all achievable gates pass.
- Run `npm run test:production-rehearsal` as a repository safety/fingerprint guard. The actual backup/restore exercise remains deferred by owner decision and must not be retried in this run.

## Pre-migration backup and change control

Before any production migration, the owner must:

1. identify the exact project ref and migration range;
2. stop concurrent schema changes and record approver/ticket;
3. verify the provider backup/PITR setting and most recent successful recovery point;
4. create a logical schema/data export using the approved Supabase CLI and a PostgreSQL 17 full logical archive, checksum and encrypt them, and store them outside the database account; default `supabase db dump` excludes managed `auth` and `storage`, so separately prove managed Auth recovery;
5. separately inventory/copy Storage objects because database metadata does not by itself prove file-object recovery; a zero-object observation needs a signed manifest but is not a database backup;
6. restore the backup into an isolated non-production target and run row-count, foreign-key, RLS, authorization, and application smoke checks;
7. apply migrations in filename order and run `supabase/tests/launch_readiness.sql` plus targeted post-migration queries.

Never run destructive authorization fixtures against production.

## Merge safety with Vercel Git integration

The `bookswap` Vercel project was historically connected directly to `suliddin1/bookswap`, but the Git integration is currently disconnected. Repository history confirms that while connected, feature-branch pushes created Preview deployments and pushes to `main` created Production deployments. GitHub Actions performs validation only; it does not own the current Vercel deployment path. CI uses non-secret public fixture values so mocked browser flows can initialize the Supabase client; it receives no service-role key and is not real-backend authorization evidence.

Before merging a release PR when production publication is not authorized:

1. In Vercel, open **bookswap > Settings > Git** and disconnect the `suliddin1/bookswap` repository.
2. Verify that the existing Production deployment remains available and that the project is not paused. Pausing the project is not an acceptable substitute because it makes Production unavailable.
3. Verify the release PR's GitHub Actions `CI / checks` and Vercel Preview checks are successful and the PR is conflict-free.
4. Merge through GitHub using the repository's approved merge strategy. Do not run `vercel --prod`, promote a deployment, or reconnect Git as part of the merge.
5. Confirm the `main` SHA and GitHub Actions push run. Keep Git disconnected until a separately approved production release window.

When production release is later authorized, reconnecting Git or deploying/promoting through Vercel is a production operation. Record the approver, exact commit, environment checks, rollback candidate, and post-deploy smoke evidence before that action.

## Rollback and forward-fix strategy

Postgres migrations in this repository are additive and do not promise automatic down-migrations. If a migration fails before commit, preserve logs and let the transaction roll back. If it commits and application compatibility is affected:

1. stop/promote no further release;
2. roll the application back to the previously verified Vercel deployment;
3. assess whether the previous application is compatible with the new schema;
4. prefer a reviewed additive forward-fix migration;
5. restore data only when a tested restore is safer than forward-fix and the incident owner approves the recovery-point loss;
6. verify Auth, catalog, upload, listing mutation, chat, report/review, admin, and privacy flows before reopening traffic.

Vercel rollback restores application code/config version; it does not reverse database migrations or Storage changes.

## Production owner verification

- Production Supabase/Vercel identities, domain, redirect allow-list, region, and data residency approved.
- All environment values configured by scope; no service key exposed to client bundles.
- Auth email confirmation, 12-character policy, secure password change, platform limits, leaked-password decision, and admin MFA verified.
- `listing-images` is public-read/service-write with 5 MB JPEG/PNG/WebP rules; unauthorized overwrite/delete and orphan cleanup are tested.
- Backup/PITR retention and a successful isolated restore are evidenced.
- Structured logs reach an approved destination without tokens, headers, passwords, full messages, or unnecessary personal data.
- Alerts route to a named owner for server errors, Auth/database/upload outages, spam, report abuse, credential leak, failed migration, accidental moderation, and account compromise.
- Legal/operator/contact/age/retention placeholders are gone and counsel approval is recorded.
- Public production smoke and real-backend authorization matrix pass; production data is not used as test fixtures.
- After representative traffic, evaluate mobile/desktop p75 LCP, CLS, and INP. Synthetic budget tests do not replace field evidence.

## Observed production gate — 28 July 2026

- The intended production database and hosting projects are separate from the guarded development environment.
- Production is non-disposable, and its migration history/schema have not been reconciled with the immutable repository migrations.
- Encrypted export, Storage copy, provider recovery, and successful isolated restore evidence remain incomplete. This fails the pre-migration gate.
- Storage ownership policy alignment, hosted Auth controls, administrator MFA, and Vercel Production variable names/scopes require owner verification.
- The existing production release predates the launch-readiness branch. Vercel Git remains disconnected, no custom domain is verified, and this change does not deploy or promote a release.
- Listing/chat content checks are deterministic repository code and require no external AI key. Notification email remains disabled until its separately documented operational requirements are met.
- The gate stopped before every production mutation. Follow DR-006 and DR-007 in `docs/ai/DECISION_REQUESTS.md`; do not deploy until backup/restore, migration baseline, Auth, Storage, variables, canonical domain, operational ownership, and legal facts are complete.

## Production migration rehearsal inspection — 29 July 2026

- Read-only normalized fingerprints prove the legacy history entries match the repository's reviewed initial baseline. An intermediate repository migration is not recorded separately, but its catalog effects are already represented by that baseline.
- Production lacks the later ordered hardening migrations. The reviewed plan is history-only canonical baselining for the initial set, followed by only the remaining ordered migrations—first on an isolated restore, never by blind production push.
- Production aggregate preconditions showed internally consistent Auth/profile state and no reviewed data conflicts; no Storage object content existed at inspection time. State can change and must be rerun immediately before backup/rehearsal/production.
- No backup file, checksum, encryption artifact, managed Auth recovery, isolated restore, migration repair, migration application, smoke test, or measured RPO/RTO was produced. The gate remains failed.
- Follow `docs/production-migration-runbook.md` and `docs/ai/PRODUCTION_MIGRATION_REHEARSAL.md`. No production reset, fixture, deployment, or Git reconnection is permitted by this evidence work.

## Clean beta provisioning gate — 30 July 2026

- The owner-designated beta, paused legacy, and development projects are three distinct PostgreSQL 17 targets. Legacy remains untouched and no legacy user, row, history, or Storage object is copied.
- The clean beta project has exact 22/22 repository migration parity without seed data. Remote launch SQL, schema lint, eight representative query plans, Security Advisor, RLS/grants/Storage structure, and the seven-role 10/10 authorization matrix pass with zero fixture residue.
- Hosted Auth has the canonical Site URL, three exact required redirects, confirmation enabled, secure password changes, a 12-character letters/digits policy, refresh rotation, and configured rate limits.
- Vercel Production has the verified beta URL/public/server key entries plus `NEXT_PUBLIC_SITE_URL` and `BOOKSWAP_PRIVATE_BETA`; the server key is sensitive and server-only. No value or project reference is documented.
- Use the active legacy `anon`/`service_role` key formats with the current client path. The modern secret format returned 403 HTML in the verified admin preflight; the legacy server role returned 200 JSON and passed the full actor matrix.
- Vercel Git remains disconnected. The controlled CLI release from the clean, pushed, CI-green `a7a5a68` checkout is `READY` on the canonical HTTPS alias; retain the previous deployment as the application rollback candidate.
- Direct post-deploy Chromium smoke passes six public routes, eight exact responsive checks, the catalog API, security headers, crawler controls, 29 asset responses, keyboard/mobile navigation, and zero real request, console, page, or runtime failures. Expected canceled Next.js speculative prefetches are recorded separately from failures.
- Do not invite friends until custom SMTP or a Send Email Hook is configured and signup confirmation plus password recovery pass through an owner-controlled non-team inbox. Supabase's default mail service is not friend-facing production email.
- Backup/restore remains deferred only for this friends beta. It is still mandatory before broad public launch, destructive/materially risky migration, or meaningful real-user data accumulation.

## Failed release and incident recovery

- Contain: disable affected feature or roll back application; preserve audit/log evidence.
- Credential leak: revoke/rotate the specific key, invalidate sessions when necessary, search exposure scope without printing the secret, and redeploy all consumers.
- Database outage/migration failure: freeze writes if needed, contact provider, use the last verified recovery point, and run integrity/authorization checks.
- Upload outage: stop new listing publication if images cannot be verified; do not weaken file validation.
- Messaging spam/report abuse: tighten documented limiter values, preserve appeal access, and review false positives.
- Accidental moderation: use audit records to restore state through an approved admin/forward-fix action; notify affected users where required.
- Account compromise: revoke sessions, reset credentials, review role/audit changes, and preserve privacy/security response evidence.
- After recovery, document timeline, impact, root cause, decisions, data loss, notification duties, and prevention work.
