# Non-deployment and production launch checklist

Updated: 28 July 2026

This document separates repository-prepared procedures from production facts that an owner must verify. A checked repository item is never evidence that production infrastructure is enabled.

## Repository-prepared release gate

- Run `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:database:static`, `npm run test:dependencies`, `npm run test:secrets`, `npm run build`, `npm run test:performance`, and `npm run test:e2e`.
- With local Docker available, run `supabase db reset`, then execute `supabase/tests/launch_readiness.sql` and `supabase/tests/marketplace_query_plans.sql` with `psql -v ON_ERROR_STOP=1`.
- With the guarded development credentials, run `npm run test:authorization` and retain only pass/fail evidence—never credentials or private fixture content.
- Require zero Supabase Security Advisor findings. Treat unused-index notices on an empty development database as non-actionable until representative traffic exists.
- Require all legal placeholders to be replaced and counsel-reviewed.
- Inspect `git diff`, generated artifacts, ignored env files, and the final secret scan; commit locally only after all achievable gates pass.

## Pre-migration backup and change control

Before any production migration, the owner must:

1. identify the exact project ref and migration range;
2. stop concurrent schema changes and record approver/ticket;
3. verify the provider backup/PITR setting and most recent successful recovery point;
4. create a logical schema/data export using the approved Supabase CLI or `pg_dump` process, encrypt it, and store it outside the database account;
5. separately inventory Storage objects because database backup does not by itself prove file-object recovery;
6. restore the backup into an isolated non-production target and run row-count, foreign-key, RLS, authorization, and application smoke checks;
7. apply migrations in filename order and run `supabase/tests/launch_readiness.sql` plus targeted post-migration queries.

Never run destructive authorization fixtures against production.

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

## Failed release and incident recovery

- Contain: disable affected feature or roll back application; preserve audit/log evidence.
- Credential leak: revoke/rotate the specific key, invalidate sessions when necessary, search exposure scope without printing the secret, and redeploy all consumers.
- Database outage/migration failure: freeze writes if needed, contact provider, use the last verified recovery point, and run integrity/authorization checks.
- Upload outage: stop new listing publication if images cannot be verified; do not weaken file validation.
- Messaging spam/report abuse: tighten documented limiter values, preserve appeal access, and review false positives.
- Accidental moderation: use audit records to restore state through an approved admin/forward-fix action; notify affected users where required.
- Account compromise: revoke sessions, reset credentials, review role/audit changes, and preserve privacy/security response evidence.
- After recovery, document timeline, impact, root cause, decisions, data loss, notification duties, and prevention work.
