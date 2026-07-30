# Owner decisions and external actions

Updated: 30 July 2026

Only facts or authority that cannot be derived safely from the repository remain here. Exchange matching, wanted titles, reader shelves, and social reading are intentionally post-launch and require no launch decision.

## DR-001 — Complete real development authorization verification

Status: **RESOLVED** on 28 July 2026.

The ignored local environment targets the dedicated development project. The public key was verified as `anon`, the private test key as `service_role`, and neither value nor project identifier was printed or committed. The guarded matrix refuses any other project, creates temporary actors, exercises anonymous/owner/unrelated/banned/moderator/admin/stale-account behavior, and removes its fixtures.

Completion evidence:

- `npm.cmd run test:env -- --authorization`: pass, exact project and both required roles present.
- `npm.cmd run test:authorization`: 10/10 pass against the real development backend.
- Temporary Auth/application/Storage-related fixtures cleaned by the guarded suite.
- `.env.test.local` is ignored by Git; no production target or production data was used.
- This is real backend evidence, not a mocked UI substitute.

## DR-002 — Insert legal identity and contact facts

Status: public-launch blocking; explicitly deferred for the clearly labeled friends-only private beta.

Provide and have qualified Azerbaijani counsel approve every value below. Do not publish placeholders:

- `[HÜQUQİ OPERATORUN ADI]`
- `[HÜQUQİ ÜNVAN]`
- `[YURİSDİKSİYA]`
- `[DƏSTƏK E-POÇTU]`
- `[MƏXFİLİK ƏLAQƏSİ]`
- `[QÜVVƏYƏ MİNMƏ TARİXİ]`
- `[MİNİMUM YAŞ VƏ VALİDEYN RAZILIĞI QAYDASI]`
- `[ETİRAZ MÜDDƏTİ VƏ CAVAB HƏDƏFİ]`
- data-retention periods and cross-border processing basis;
- any legally required registration, tax, consumer, and regulator disclosures.

Update `/terms`, `/privacy`, `/marketplace-rules`, and `/moderation-appeals`; search the repository for `[` placeholders; obtain written approval; then record reviewer/date/version in `docs/ai/QA_EVIDENCE.md`.

## DR-003 — Production Auth security choices

Status: production/deployment-only, but required before public launch.

In the production Supabase project, confirm 12-character password minimum, email confirmation, secure password changes, exact redirect allow-list, generic reset behavior, platform Auth rate limits, and administrator MFA enforcement. Local `supabase/config.toml` contains the intended free controls.

Supabase leaked-password protection is a paid-plan option. Choose one:

1. enable a plan/control that provides leaked-password protection; or
2. explicitly accept the residual risk with the implemented compensating controls: 12-character application/local policy, platform and application rate limits, generic errors, secure reset redirects, rotating sessions, server-side authorization, and no client-side role trust.

No homemade leaked-password database is permitted. Optional CAPTCHA should be enabled only for high-risk anonymous Auth flows after provider, privacy basis, keys, and accessibility fallback are approved; the repository does not claim CAPTCHA is enabled.

Observed 28 July 2026: the intended production project is active and reports leaked-password protection disabled. All other hosted Auth settings remain unverified. In Supabase Dashboard, open **Authentication > URL Configuration**, **Sign In / Providers > Email**, **Sessions**, **Rate Limits**, and **Attack Protection**; record settings without copying secrets. Set the production Site URL to the approved HTTPS canonical origin and permit only required production callback paths. Remove localhost/preview redirects from production unless an owner records a narrow reason. Enforce MFA for every administrator before public launch.

## DR-004 — Production operations ownership

Status: production/deployment-only. The intended production Supabase and Vercel projects are identified privately. Ownership, recovery, domain, alert, and release decisions remain open.

Name the production Supabase/Vercel projects, domain, region/data-residency decision, deployment approver, incident commander, on-call/alert destination, log owner/retention, backup retention, restore target, support/privacy mailbox owners, moderation SLA, and secret-rotation owner. Verify backups and restore in production; repository procedures are not proof that either is enabled.

## DR-005 — Optional operational provider decisions

Status: production/deployment-only. Core listing and chat safety requires no external AI/content-classification service or key.

- Choose and configure a real error-monitoring/log destination, or retain provider-neutral structured platform logs.
- Provide Resend credentials only if notification email is enabled and templates/privacy/retention are approved.
- Enable `WEB_VITALS_ENABLED=true` only after log access, retention, alert queries, and privacy scope are approved.
- Enable CAPTCHA only after provider, privacy basis, keys, and an accessible fallback are approved for specific high-risk anonymous Auth flows.

No fake DSN, token, or API key may be committed.

## DR-006 — Production migration baseline and recovery approval

Status: deferred/risk-accepted for friends-only private beta; mandatory before broad public launch or any destructive/materially risky production migration.

Read-only evidence now identifies the mismatch precisely. Production's legacy migration SQL exactly fingerprint-matches the reviewed repository baseline; an intermediate migration is not recorded separately, but its effects are already represented in the initial schema. Later ordered hardening migrations remain unapplied. The development project's stored SQL also matches the repository files while its timestamp versions differ, supporting an invocation-time versioning root-cause inference. Production is non-disposable, and no history repair or schema write has occurred.

Before any schema write:

1. In Supabase **Database > Backups**, record the actual available recovery options; do not claim Free-plan recovery that is not displayed.
2. Provide a PostgreSQL 17/Docker-capable operator environment, database connection secret through the approved secret manager, an encrypted destination outside the repository/project account, and an approved fresh/disposable restore target. Do not send secrets in chat.
3. Create and checksum the portable logical bundle and a full logical archive. Default `supabase db dump` excludes managed `auth` and `storage`; separately prove provider-supported Auth recovery. Create a separate `listing-images` inventory/copy even when the signed inventory is zero objects.
4. Restore into an isolated target, compare counts/checksums/Auth profiles, and verify the legacy SQL fingerprints with `supabase/tests/production_rehearsal_read_only.sql`.
5. On that target only, use privately verified legacy versions to repair history and mark the reviewed canonical baseline applied. Require `supabase db push --dry-run` to list only the remaining ordered migrations, then rehearse them in filename order.
6. Run SQL structure/integrity/advisor checks, restored Auth and at least two-user authorization, and application smoke; record measured RPO/RTO. Delete only disposable rehearsal fixtures.
7. Approve and record the production maintenance window, write freeze, forward-fix owner, previous Vercel production deployment, and data-loss tolerance.

Follow `docs/production-migration-runbook.md` and the sanitized evidence in `docs/ai/PRODUCTION_MIGRATION_REHEARSAL.md`. No production reset is permitted. An existing development project is never automatically disposable; reset/reprovision requires explicit owner approval and private history verification.

## DR-007 — Controlled production release approval

Status: owner-authorized conditionally for friends-only private beta, but currently blocked by application/schema incompatibility. DR-002 and the backup portion of DR-006 are accepted private-beta deferrals, not standalone beta blockers. DR-005 services remain optional.

Read-only Vercel metadata now confirms that Production has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and a non-readable sensitive `SUPABASE_SERVICE_ROLE_KEY`; the Supabase URL targets the intended production project and is distinct from development. `NEXT_PUBLIC_SITE_URL` and `BOOKSWAP_PRIVATE_BETA` are absent. Never expose or attempt to read the sensitive value.

Leave the Git integration disconnected. A reviewed `main` commit may be deployed through the controlled Vercel CLI only after its database contracts exist safely, all repository gates pass, the canonical HTTPS origin and beta flag are configured, and the exact target is reconfirmed. Record the deployed commit and smoke evidence; retain the old production deployment only as an application rollback candidate, noting that an app rollback cannot reverse database changes.

## DR-008 — Friends-only private-beta risk decision

Status: **RESOLVED by owner on 30 July 2026.**

- Defer the encrypted production database/Auth/Storage backup and isolated restore rehearsal. Do not request a database password or Personal Access Token, enable temporary database access, reset a password, retry a dump, restore, or start an encryption-passphrase flow.
- Accept the missing recovery proof as a temporary friends-only beta risk. Complete a verified encrypted backup before broad public launch, before a destructive or materially risky production migration, or after meaningful real-user data accumulates.
- Final legal operator/contact/age/retention/counsel facts may remain a public-launch follow-up while the beta is visibly identified, invitation-only, and warns testers not to enter sensitive personal or payment data.
- This decision does not authorize deploying current code against an incompatible schema. Production lacks migrations 4–22, and the required sequence includes a lock/rewrite-sensitive generated-search rebuild. That compatibility gate remains a hard stop.

## Resolved product decisions

- Launch MVP: Azerbaijani-first used-book listing, discovery, buying, and selling.
- Payment, escrow, shipping, delivery, and handover are participant responsibilities.
- Automated exchange matching, wanted-title matching, shelves, social reading, and edition intelligence are post-launch.
- A dedicated `sale/exchange/both` schema is not included: the current product coherently supports sale, and no public copy promises a full exchange platform.
- No AI/OpenAI service is part of launch. Listing/chat safety is deterministic and human-review-backed; it does not claim semantic image understanding.
- Normal-user listings and messages are free. There is no commission, integrated payment, VIP listing, subscription/Pro tier, or display advertising at launch.
- Paid listing promotion, professional seller plans, and direct sponsorships are future candidates only and are not implemented or promised.
- Revisit monetization only after measurable listing supply, buyer activity, and seller demand exist; require a separate product/legal/fairness decision before implementation.
- No paid service, production project, or deployment was authorized by this readiness run.
