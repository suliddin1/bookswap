# Owner decisions and external actions

Updated: 7 August 2026

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

Status: **PARTIALLY RESOLVED on 7 August 2026; qualified legal and external compliance review remains launch-blocking.**

Owner-approved repository facts:

- operator full name: `Suliddin Musa Əsədzadə`;
- legal/privacy contact: `Suliddin677@gmail.com`;
- current legal version: `2026-08-07`, effective/updated 7 August 2026;
- minimum age: 18;
- governing law: Azerbaijan.

The public pages and footer use those centralized values and contain no legacy identity/date/age/jurisdiction placeholders. A physical/service address was not supplied and is not invented in the approved copy. Qualified Azerbaijani counsel must still confirm whether another address/disclosure is legally required, approve the texts and response/appeal wording, confirm the retention and cross-border basis, and resolve state-registration, licensed-activity, tax, consumer, and regulator questions. Record reviewer, date, version, and any required correction in `docs/ai/QA_EVIDENCE.md` before public launch.

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

Status: launch-blocking production decision.

Production migration history and schema differ from the immutable repository migration set, and production is non-disposable. Before any schema write:

1. In Supabase **Database > Backups**, record the actual available recovery options; do not claim Free-plan recovery that is not displayed.
2. Create an encrypted logical export with the Supabase CLI/`pg_dump`, plus a separate `listing-images` object inventory/copy, and store both outside the project account.
3. Restore into an isolated non-production project and run `supabase/tests/launch_readiness.sql`, row/count/integrity checks, and `npm.cmd run test:authorization`; delete only disposable restore-test fixtures.
4. Compare the production baseline schema with the repository's initial migrations. Only after exact equivalence is reviewed, repair the migration-history baseline; never rerun table or type creation blindly.
5. Approve and record the remaining ordered migration range, maintenance window, forward-fix owner, previous Vercel production deployment, and data-loss tolerance.

No production reset is permitted.

## DR-007 — Controlled production release approval

Status: blocked until DR-002, DR-003, DR-004, and DR-006 are resolved. DR-005 services are optional and do not block launch when left disabled.

In Vercel **Settings > Environment Variables**, verify by name only that Production has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SITE_URL`. Confirm the Supabase values belong to the intended production project, keep the service role server-only, and do not reuse development values. Leave Git disconnected. After migrations/Auth/Storage/recovery/alerts and all repository gates pass, authorize one explicit deployment of a reviewed `main` commit through the controlled Vercel deployment tool. Record the resulting release evidence and retain the previously verified production release as the application rollback candidate, noting that an app rollback does not reverse database changes.

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
