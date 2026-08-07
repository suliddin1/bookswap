# Production backup, restore, and migration reconciliation runbook

Updated: 29 July 2026

This is an operator procedure, not authorization. It must first pass on an isolated restore. **No production reset is permitted.** Never run `supabase db reset --linked`, never load repository seed data into production, and never use production accounts or rows as test fixtures.

## Hard stop conditions

Stop before any production write unless all conditions are true:

- a named approver, operator, incident owner, maintenance window, write-freeze plan, and rollback/forward-fix owner are recorded;
- the exact source and isolated target are verified without recording connection strings or project references in Git;
- Supabase CLI and PostgreSQL 17 client versions and command help are captured;
- an encrypted off-repository destination has enough space and approved retention/access controls;
- Dashboard recovery options are recorded exactly as displayed;
- the logical archive, Storage evidence, checksums, and isolated restore all pass;
- Auth recovery is proven; default `supabase db dump` excludes Supabase-managed `auth` and `storage` schemas and is not by itself complete recovery evidence;
- rehearsal history repair yields exactly 19 pending migrations and the restored application checks pass;
- legal, hosted Auth, environment, operations, and deployment gates are separately approved.

## Operator variables and secret handling

Set these only in the operator's process from the approved secret manager. Do not paste values into chat, shell history, screenshots, tickets, or repository files.

```powershell
$env:PRODUCTION_DB_URL = '<percent-encoded session-pooler or direct URL from Connect>'
$env:RESTORE_DB_URL = '<percent-encoded isolated-target URL>'
$env:RESTORE_PROJECT_REF = '<isolated-target ref>'
$env:BACKUP_DIR = '<absolute encrypted destination outside the repository>'
$env:LEGACY_INITIAL_VERSION = '<legacy initial-schema version from private evidence>'
$env:LEGACY_HARDENING_VERSION = '<legacy hardening version from private evidence>'
```

Before continuing, resolve `$env:BACKUP_DIR` and verify it is not inside the workspace, cloud-synced personal storage, or a public/shared directory. Clear the process variables when the session ends.

## 1. Preflight and read-only evidence

From the reviewed repository commit:

```powershell
supabase --version
supabase db dump --help
supabase migration repair --help
supabase db push --help
pg_dump --version
pg_restore --version
psql --version
npm run test:production-rehearsal
psql "$env:PRODUCTION_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/production_rehearsal_read_only.sql
```

Require PostgreSQL 17-compatible clients. Store command output only in the approved encrypted evidence location and redact connection details. Confirm aggregate preconditions remain zero and the two legacy normalized fingerprints match `docs/ai/PRODUCTION_MIGRATION_REHEARSAL.md`.

Record backup start time and the last accepted write. If a write freeze is approved, begin it now. The logical dump uses a consistent snapshot, but the recorded recovery point must still be explicit.

## 2. Create database backup files

Supabase's documented portable bundle:

```powershell
supabase db dump --db-url "$env:PRODUCTION_DB_URL" -f "$env:BACKUP_DIR\roles.sql" --role-only
supabase db dump --db-url "$env:PRODUCTION_DB_URL" -f "$env:BACKUP_DIR\schema.sql"
supabase db dump --db-url "$env:PRODUCTION_DB_URL" -f "$env:BACKUP_DIR\data.sql" --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
supabase db dump --db-url "$env:PRODUCTION_DB_URL" -f "$env:BACKUP_DIR\history_schema.sql" --schema supabase_migrations
supabase db dump --db-url "$env:PRODUCTION_DB_URL" -f "$env:BACKUP_DIR\history_data.sql" --use-copy --data-only --schema supabase_migrations
```

Also create a native full logical archive with PostgreSQL 17 so managed-schema coverage can be inspected and restored to an isolated PostgreSQL scratch database:

```powershell
pg_dump --format=custom --no-owner --no-privileges --file "$env:BACKUP_DIR\database-full.dump" "$env:PRODUCTION_DB_URL"
pg_restore --list "$env:BACKUP_DIR\database-full.dump"
```

The full archive is not permission to overwrite Supabase-managed schemas in a hosted target. Review its table of contents and use a Supabase-supported restore path for managed Auth/Storage. If the Dashboard cannot provide restore-to-new-project and a supported Auth recovery path is not approved, PROD-003 remains blocked.

Record end time, byte size, and SHA-256 without opening data files:

```powershell
Get-ChildItem -LiteralPath "$env:BACKUP_DIR" -File | Select-Object Name,Length,LastWriteTimeUtc
Get-ChildItem -LiteralPath "$env:BACKUP_DIR" -File | Get-FileHash -Algorithm SHA256
```

Encrypt the bundle with the organization's approved authenticated-encryption tool and key custody process. Verify the encrypted archive can be decrypted to a separate encrypted scratch location and that all checksums match. Do not delete the unencrypted source until the encrypted copy and restore test are verified under the retention policy.

## 3. Capture Storage separately

Re-run the read-only inventory. Record bucket configuration, object count, aggregate bytes, and an object-key/checksum manifest in the encrypted evidence store. Never print object contents.

If the fresh inventory is empty, record a signed zero-object manifest; that is inventory evidence, not a copied-object backup. If non-empty, use the official Storage CLI/S3 download process, preserve paths and content types, checksum every downloaded object, and compare count/bytes/checksums before restore. Database metadata and physical objects are separate recovery surfaces.

Do not enable S3 or create access keys without explicit owner approval. If enabled for the exercise, store credentials only in the approved secret manager and revoke them after verification.

## 4. Prepare an isolated restore target

Preferred target: a fresh disposable Supabase project in the same major Postgres version and region, created only with billing approval. Alternative: an explicitly approved reprovision of a named non-production project. An existing development project must never be assumed disposable from aggregate counts alone; verify its ownership, history, and reset authorization explicitly.

Record the target's empty-state inventory. Enable only required non-default extensions. Keep email delivery and all external side effects disabled. Do not connect Vercel or a production domain.

## 5. Restore the portable bundle

On a fresh target, first review the SQL. Follow current Supabase troubleshooting guidance for target-owned role lines; never make unreviewed broad privilege edits. Restore in one transaction:

```powershell
psql --single-transaction --variable ON_ERROR_STOP=1 --file "$env:BACKUP_DIR\roles.sql" --file "$env:BACKUP_DIR\schema.sql" --command "SET session_replication_role = replica" --file "$env:BACKUP_DIR\data.sql" --dbname "$env:RESTORE_DB_URL"
psql --single-transaction --variable ON_ERROR_STOP=1 --file "$env:BACKUP_DIR\history_schema.sql" --file "$env:BACKUP_DIR\history_data.sql" --dbname "$env:RESTORE_DB_URL"
```

Restore or recreate Realtime publications and any reviewed custom `auth`/`storage` trigger or policy changes using the Supabase-supported procedure. Restore Storage objects separately and compare inventory/checksums. Prove managed Auth recovery; a public profile row without its corresponding Auth account is a failure.

Run the read-only script against the target and compare database/table/Storage counts and migration fingerprints with the source evidence. Record restore start and the time at which integrity plus application smoke becomes green.

## 6. Reconcile migration history on the isolated target only

Link only after independently verifying the target reference and its empty/disposable label:

```powershell
supabase link --project-ref "$env:RESTORE_PROJECT_REF"
supabase migration list --linked
```

After a second reviewer confirms exact fingerprint and catalog equivalence, repair history metadata without executing the first three SQL files:

```powershell
supabase migration repair "$env:LEGACY_INITIAL_VERSION" "$env:LEGACY_HARDENING_VERSION" --status reverted --linked
supabase migration repair 202606140001 202606140002 202606150001 --status applied --linked
supabase migration list --linked
supabase db push --dry-run --linked
```

The dry run must list exactly 19 pending migrations, from `20260712155914_security_marketplace_hardening.sql` through `20260728071355_clarify_private_rate_limit_policy.sql`. Any other result is a hard stop. `migration repair` changes only `supabase_migrations` history; it does not make a mismatched schema safe.

## 7. Apply the remaining migrations in rehearsal

With monitoring active and the target still isolated:

```powershell
supabase db push --linked
supabase migration list --linked
```

Record per-migration timing and errors. Pay special attention to migrations 4, 5, 7, 14, and 21; migration 21 drops/recreates the listing search generated column/index and may hold locks or rewrite data. Do not skip immutable migration 10 even though migration 21 later removes its temporary browser Storage policy.

If a migration fails, stop. Preserve logs, verify transaction state, diagnose, and prepare a reviewed additive forward fix if necessary. Do not edit an applied migration or falsify its status.

## 8. Validate the restored and migrated target

Run:

```powershell
psql "$env:RESTORE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/launch_readiness.sql
psql "$env:RESTORE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/marketplace_query_plans.sql
npm run test:database:static
npm run test:production-rehearsal
npm run test:env -- --authorization
npm run test:authorization
```

Use ignored target-specific environment files; verify the guard identifies only the isolated target. Exercise at least two temporary users plus seller/admin roles where supported. Delete only exercise-created target fixtures. Never delete restored source rows.

Required manual/application checks:

- Auth sign-in/session refresh and Auth/profile correspondence;
- anonymous catalog, listing detail, and hidden/draft denial;
- owner listing create/edit/status/delete and unrelated/banned denial;
- service-only image mutation and restored image reads/checksums;
- favorites, buyer/seller room access, message/read-state/notification behavior;
- reports, eligible reviews, privacy requests, admin audit, and moderator denial;
- RLS, grants, function execute privileges, Storage policies, Realtime publication;
- Security and Performance Advisors, logs, failed requests, accessibility, and target-only browser smoke.

The target passes only when counts/checksums agree, all 22 canonical migration versions are present, advisors are reviewed, authorization passes, and no restored source data was mutated by tests.

## 9. Record RPO and RTO

- RPO: the difference between the last accepted source write/recovery point and the consistent backup snapshot. Record the timestamp and whether writes were frozen.
- RTO: restore start through database integrity, Storage verification, Auth recovery, migrations, and application smoke all passing.

Record measured values, not estimates. If they exceed the owner-approved tolerance, PROD-003 remains blocked.

## 10. Production change plan — separately authorized only

After rehearsal approval, repeat fresh backup/checksum/Storage evidence immediately before the production window. Re-run all read-only preconditions. Freeze concurrent schema changes and approved writes. Verify source identity twice.

Use the same reviewed history repair sequence against production only after explicit named authorization, then require `supabase db push --dry-run --linked` to show the same 19 files. Apply once, monitor locks/errors, run post-migration structural and application smoke, and keep Vercel Git disconnected until a separate deployment approval.

Application rollback does not reverse database migrations. Prefer a reviewed additive forward fix. Restore only when the incident owner decides it is safer and accepts the measured recovery-point loss.

## Official references

- [Supabase backup and restore using CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase db dump](https://supabase.com/docs/reference/cli/supabase-db-dump)
- [Supabase migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair)
- [Supabase db push and dry run](https://supabase.com/docs/reference/cli/supabase-db-push)
- [Supabase Storage downloads](https://supabase.com/docs/guides/storage/management/download-objects)
- [PostgreSQL 17 SQL dump recovery](https://www.postgresql.org/docs/17/backup-dump.html)
- [PostgreSQL 17 pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html)
- [Supabase breaking changes](https://supabase.com/changelog?types=breaking-change)
