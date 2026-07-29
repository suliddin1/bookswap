# Production migration rehearsal evidence

- Date: 29 July 2026
- Scope: PROD-001 and PROD-003
- Branch: `ops/production-migration-rehearsal`
- Repository baseline: `6235bfeb115516e0a2180525c77d99443033bc60`

## Verdict

**BLOCKED before backup and restore; production remains unchanged and is not launch-ready.** Read-only inventory, schema/history fingerprinting, migration classification, precondition queries, and a reviewable runbook are complete. No logical database file, encryption checksum, off-project Storage copy, isolated restore, migration application, Auth exercise, or application smoke was produced in this environment.

The stop is intentional. This workstation has no Supabase CLI, Docker/Podman, PostgreSQL 17 client tools, database password/connection URL, or approved encrypted backup destination. The available connector supports aggregate/catalog inspection but cannot create a restorable logical archive. An existing empty non-production project was observed, but it is not a clean restore target: it already has all 22 migrations recorded under generated remote versions, and no reset/reprovision action was authorized.

## Safety record

- Production access was limited to read-only aggregate, catalog, migration-history, and advisor queries. No row content or identifier was retained.
- No production DDL, DML, migration repair, fixture, Auth/Storage configuration change, object transfer, deployment, Vercel mutation, push, PR, or merge occurred.
- No credential, project reference, connection URL, user data, Storage object content, or backup artifact was printed or committed.
- Historical migrations were not edited. No speculative reconciliation migration was created.
- The organization was observed on the Free plan. Dashboard backup/PITR availability was not visible through the connector and is therefore unverified, not assumed absent or present.

## Sanitized production inventory

| Item                | Read-only observation                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| PostgreSQL          | 17.6; database approximately 11 MB                                                                        |
| Auth/profile        | 1 Auth account and 1 matching public profile                                                              |
| Marketplace data    | listings, rooms, messages, reviews, notifications, favorites, and reports all contain 0 rows              |
| Storage             | one public `listing-images` bucket; 0 objects and 0 bytes; 5 MiB JPEG/PNG/WebP configuration              |
| Public schema       | users, listings, chat_rooms, messages, reviews, notifications, favorites, reports                         |
| RLS                 | enabled on every observed public application table                                                        |
| Realtime            | messages and notifications in the publication                                                             |
| Public functions    | only `handle_new_user()`; security definer                                                                |
| Production advisors | leaked-password protection disabled warning; legacy policy init-plan and unused-index performance notices |

The production schema is the legacy baseline. It still has broad legacy table grants and browser Storage mutation policies. It does not contain the privacy, audit, moderation, chat-read, cleanup-job, protected mutation, catalog RPC, durable limiter, or launch-hardening contracts from migrations 4–22.

All observed precondition aggregates were zero: Auth/profile mismatch; user length checks; listing bounds/enums/image count; self-room and listing/seller mismatch; hidden favorite targets; report reason/target/duplicate-open groups; review comment violations; and Storage objects.

## Migration-history diagnosis

Production contains two legacy migration rows:

| Remote version   | Remote name               | Normalized length | Normalized SHA-256                                                 | Repository equivalence                                     |
| ---------------- | ------------------------- | ----------------: | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| `20260615051127` | `bookswap_initial_schema` |              6819 | `95c30fe9550a05fbc9edf0daff61d1960931955a82b6709bbde54251b4f76968` | exact SQL match to `202606140001_init.sql`                 |
| `20260615051302` | `production_hardening`    |               916 | `2903172dd9d5bb97cd01eaba88c8e56a779c4adeef1f7ebf3140286bc17a7362` | exact SQL match to `202606150001_production_hardening.sql` |

`202606140002_marketplace_upgrade.sql` is not recorded by name/version, but its tables, constraints, indexes, triggers, and policies are already represented by the exact initial-schema baseline. Its normalized fingerprint is `1bd601d9fdf05aded9fe03881acacbd8ff224203e0a5d883120607daa2a8253e`.

The non-production development project records all 22 migration names under server-generated timestamps. Every stored normalized SQL fingerprint matches the repository file with the same name. The evidence supports this root-cause inference: earlier remote migration execution assigned invocation-time versions instead of preserving repository filename versions. The exact historical command is unavailable, so the inference must not be promoted to certainty.

## Classification legend

1. Baseline already represented: history-only reconciliation after exact equivalence review; do not execute SQL again.
2. Custom reconciliation migration: additive SQL needed to bridge a proven schema difference. None is currently justified.
3. Safe ordered migration: additive/idempotent DDL or privilege/policy tightening; still rehearse in order.
4. Data-sensitive or locking migration: preconditions, lock/time observation, and rollback/forward-fix review required.
5. Destructive/unsupported: would need a separate decision. None is present in the immutable set.
6. Superseded transient state: preserve and run in immutable order on a baseline restore even though a later migration removes/tightens it.

## Ordered 22-migration assessment

|   # | Migration                                                          | Class | Rehearsal decision and risk                                                                                                                                                                                                 |
| --: | ------------------------------------------------------------------ | :---: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | `202606140001_init.sql`                                            |   1   | Exact production fingerprint; mark canonical version applied only after isolated verification; never rerun table/type creation.                                                                                             |
|   2 | `202606140002_marketplace_upgrade.sql`                             |   1   | Effects already represented in the legacy initial schema; baseline only after object-by-object isolated check.                                                                                                              |
|   3 | `202606150001_production_hardening.sql`                            |   1   | Exact production fingerprint; canonical history-only baseline.                                                                                                                                                              |
|   4 | `20260712155914_security_marketplace_hardening.sql`                |   4   | Grants/RLS replacement, constraints, unique partial index, privacy table, and privileged-function tightening; zero current data violations observed.                                                                        |
|   5 | `20260714033950_fix_chat_room_seller_authorization.sql`            |   4   | Adds composite ownership FK and aborts on mismatched rooms; mismatch count is zero.                                                                                                                                         |
|   6 | `20260714035115_add_chat_room_listing_seller_index.sql`            |   3   | Additive supporting index.                                                                                                                                                                                                  |
|   7 | `20260714040618_secure_favorite_listing_visibility.sql`            |   4   | New trigger can reject invalid favorite rows; favorites are empty and precondition is zero.                                                                                                                                 |
|   8 | `20260714041157_restrict_banned_user_favorite_access.sql`          |   3   | RLS tightening.                                                                                                                                                                                                             |
|   9 | `20260714052000_add_listing_image_cleanup_jobs.sql`                |   3   | Additive cleanup queue/function/trigger contract.                                                                                                                                                                           |
|  10 | `20260714053500_allow_owner_listing_image_selection.sql`           |   6   | Temporary owner Storage selection policy, later removed by launch hardening; keep immutable ordering.                                                                                                                       |
|  11 | `20260714054500_make_cleanup_jobs_service_only_explicit.sql`       |   3   | Explicit service-only policy posture.                                                                                                                                                                                       |
|  12 | `20260714055500_deduplicate_listing_image_cleanup_jobs.sql`        |   3   | Additive deduplication behavior.                                                                                                                                                                                            |
|  13 | `20260714061000_add_listing_pagination_indexes.sql`                |   3   | Additive pagination indexes.                                                                                                                                                                                                |
|  14 | `20260714063000_add_chat_read_state_and_durable_notifications.sql` |   4   | Adds/backfills room state, read rows, triggers, notifications, and publication state; affected production tables are empty.                                                                                                 |
|  15 | `20260714070000_add_reviewable_moderation_decisions.sql`           |   3   | Additive moderation decision table and policies.                                                                                                                                                                            |
|  16 | `20260714073000_add_transactional_admin_audit.sql`                 |   3   | Additive immutable audit table and transactional admin RPCs.                                                                                                                                                                |
|  17 | `20260714080000_require_protected_listing_mutations.sql`           |   3   | Revokes direct browser listing mutations; application compatibility must be smoked.                                                                                                                                         |
|  18 | `20260724090000_add_public_marketplace_page_rpcs.sql`              |   3   | Additive public catalog RPCs.                                                                                                                                                                                               |
|  19 | `20260724093000_contain_marketplace_page_rpcs.sql`                 |   3   | Narrows catalog RPC search path/execution boundary.                                                                                                                                                                         |
|  20 | `20260724094500_reject_null_marketplace_sort.sql`                  |   3   | Tightens RPC argument validation.                                                                                                                                                                                           |
|  21 | `20260728064350_launch_readiness_hardening.sql`                    |   4   | Adds many constraints/triggers/private limiter; drops/recreates generated search column/index and can lock/rewrite listings. All current aggregate preconditions are zero, but maintenance-window timing is still required. |
|  22 | `20260728071355_clarify_private_rate_limit_policy.sql`             |   3   | Explicit private rate-limit RLS documentation/policy posture.                                                                                                                                                               |

No class-2 SQL is justified by current evidence. The only planned reconciliation is migration-history metadata repair, first on an isolated restore. No class-5 migration is present.

## Proposed isolated reconciliation sequence — not executed

1. Produce and checksum an encrypted off-repository backup plus a separate Storage inventory/copy. Because default `supabase db dump` excludes `auth` and `storage`, obtain a provider-supported managed-schema/Auth recovery path or prove a PostgreSQL full archive restore as well; the single Auth account makes this a real gate.
2. Restore to a newly created/disposable Supabase project or an explicitly approved reset/reprovisioned target. The existing development project is only a candidate, not a confirmed target.
3. Restore the two legacy migration-history rows and verify their normalized hashes using `supabase/tests/production_rehearsal_read_only.sql`.
4. On the isolated target only, mark legacy versions `20260615051127` and `20260615051302` reverted, then mark canonical versions `202606140001`, `202606140002`, and `202606150001` applied.
5. Require `supabase db push --dry-run` to list exactly the remaining 19 repository migrations, beginning `20260712155914` and ending `20260728071355`.
6. Apply only those 19 migrations in filename order; record timing, locks, errors, and advisor output.
7. Run structural SQL, counts/integrity, RLS/grants/Storage/Realtime checks, two-user authorization, Auth/login, and application smoke tests against the isolated target.
8. Record measured RPO/RTO and only then request a separate production change approval.

## Evidence status

| Required artifact                          | Status                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| Read-only production inventory             | PASS; aggregate/catalog only                                        |
| Legacy migration fingerprint equivalence   | PASS for migrations 1 and 3                                         |
| Migration 2 logical baseline equivalence   | PASS by catalog review; must be repeated after restore              |
| All 22 repository fingerprints             | PASS locally; guarded by `npm run test:production-rehearsal`        |
| Database backup file + checksum            | BLOCKED; not created                                                |
| Encrypted off-project backup               | BLOCKED; no approved destination/tool                               |
| Storage inventory                          | PASS as read-only zero-object observation; no copy artifact created |
| Managed Auth recovery evidence             | BLOCKED; default CLI dump exclusion is material                     |
| Isolated restore and checksum verification | BLOCKED; not run                                                    |
| Migration-history repair rehearsal         | BLOCKED; not run                                                    |
| Remaining 19 migration rehearsal           | BLOCKED; not run                                                    |
| Restored Auth/two-user/application smoke   | BLOCKED; not run                                                    |
| Measured RPO/RTO                           | BLOCKED; not measured                                               |
| Production mutation/deployment             | NOT AUTHORIZED; none performed                                      |

## Official references

- [Supabase CLI backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase database dump reference](https://supabase.com/docs/reference/cli/supabase-db-dump)
- [Supabase migration repair reference](https://supabase.com/docs/reference/cli/supabase-migration-repair)
- [Supabase database push and dry-run reference](https://supabase.com/docs/reference/cli/supabase-db-push)
- [Supabase Storage object downloads](https://supabase.com/docs/guides/storage/management/download-objects)
- [PostgreSQL 17 SQL dump recovery](https://www.postgresql.org/docs/17/backup-dump.html)
- [PostgreSQL 17 pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html)
- [Supabase breaking changes](https://supabase.com/changelog?types=breaking-change)
