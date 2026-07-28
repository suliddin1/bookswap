# Owner decisions and external actions

Updated: 28 July 2026

Only facts or authority that cannot be derived safely from the repository remain here. Exchange matching, wanted titles, reader shelves, and social reading are intentionally post-launch and require no launch decision.

## DR-001 — Complete real development authorization verification

Status: **RESOLVED** on 28 July 2026.

The ignored local environment targets `bookswap-development` (`uibatsbzjswmtdvdrlxj`). The public key was verified as `anon`, the private test key as `service_role`, and neither value was printed or committed. The guarded matrix refuses any other project, creates temporary actors, exercises anonymous/owner/unrelated/banned/moderator/admin/stale-account behavior, and removes its fixtures.

Completion evidence:

- `npm.cmd run test:env -- --authorization`: pass, exact project and both required roles present.
- `npm.cmd run test:authorization`: 10/10 pass against the real development backend.
- Temporary Auth/application/Storage-related fixtures cleaned by the guarded suite.
- `.env.test.local` is ignored by Git; no production target or production data was used.
- This is real backend evidence, not a mocked UI substitute.

## DR-002 — Insert legal identity and contact facts

Status: launch-blocking; legal structure and Azerbaijani-first drafts complete.

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

Observed 28 July 2026: production project `bookswap` (`lnhublqrtkdrrafghvki`) is active and reports leaked-password protection disabled. All other hosted Auth settings remain unverified. In Supabase Dashboard, open **Authentication > URL Configuration**, **Sign In / Providers > Email**, **Sessions**, **Rate Limits**, and **Attack Protection**; record settings without copying secrets. Set the production Site URL to the approved HTTPS canonical origin and permit only exact production callback paths needed for `/profile` and `/reset-password`. Remove localhost/preview redirects from production unless an owner records a narrow reason. Enforce MFA for every administrator before public launch.

## DR-004 — Production operations ownership

Status: production/deployment-only. The production Supabase identity is now known: `bookswap`, ref `lnhublqrtkdrrafghvki`, region `eu-central-1`. The Vercel project is `bookswap` (`prj_jK49lo72xejgNwD89stuffs8uu6a`). Ownership, recovery, domain, alert, and release decisions remain open.

Name the production Supabase/Vercel projects, domain, region/data-residency decision, deployment approver, incident commander, on-call/alert destination, log owner/retention, backup retention, restore target, support/privacy mailbox owners, moderation SLA, and secret-rotation owner. Verify backups and restore in production; repository procedures are not proof that either is enabled.

## DR-005 — Required moderation and optional provider credentials

Status: production/deployment-only. Automated moderation is already required by launch-critical listing and chat mutations and fails closed when unavailable.

- Choose and configure a real error-monitoring/log destination, or retain provider-neutral structured platform logs.
- Approve the OpenAI moderation processor/privacy terms and place a production-only `OPENAI_API_KEY` in Vercel Production. Without it, listing creation/publication and message sending return a stable 503; local rules can reject but do not approve content.
- Provide Resend credentials only if notification email is enabled and templates/privacy/retention are approved.
- Enable `WEB_VITALS_ENABLED=true` only after log access, retention, alert queries, and privacy scope are approved.

No fake DSN, token, or API key may be committed.

## DR-006 — Production migration baseline and recovery approval

Status: launch-blocking production decision.

Production records two legacy migrations (`bookswap_initial_schema`, `production_hardening`) while the repository has 22 immutable migration files. Production also contains one Auth account/profile. Before any schema write:

1. In Supabase **Database > Backups**, record the actual available recovery options; do not claim Free-plan recovery that is not displayed.
2. Create an encrypted logical export with the Supabase CLI/`pg_dump`, plus a separate `listing-images` object inventory/copy, and store both outside the project account.
3. Restore into an isolated non-production project and run `supabase/tests/launch_readiness.sql`, row/count/integrity checks, and `npm.cmd run test:authorization`; delete only disposable restore-test fixtures.
4. Compare the production baseline schema with the repository's first three migrations. Only after exact equivalence is reviewed, repair the migration-history baseline for `202606140001`, `202606140002`, and `202606150001`; never rerun their table/type creation blindly.
5. Approve and record the remaining ordered migration range, maintenance window, forward-fix owner, previous Vercel production deployment, and data-loss tolerance.

No production reset is permitted.

## DR-007 — Controlled production release approval

Status: blocked until DR-002 through DR-006 are resolved.

In Vercel **bookswap > Settings > Environment Variables**, verify by name only that Production has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, and `OPENAI_API_KEY`. Confirm the two Supabase keys belong to `lnhublqrtkdrrafghvki`, keep the service role server-only, and do not reuse development values. Leave Git disconnected. After migrations/Auth/Storage/recovery/alerts and all repository gates pass, authorize one explicit deployment of `cf126c3c4a408007eacf7d337f485be69e23517c` or a reviewed successor through the controlled Vercel deployment tool. Record deployment ID/URL and retain `dpl_3YJ15xSUXwLvT82Q2ZDc8E9BRR7f` as the application rollback candidate, noting that an app rollback does not reverse database changes.

## Resolved product decisions

- Launch MVP: Azerbaijani-first used-book listing, discovery, buying, and selling.
- Payment, escrow, shipping, delivery, and handover are participant responsibilities.
- Automated exchange matching, wanted-title matching, shelves, social reading, and edition intelligence are post-launch.
- A dedicated `sale/exchange/both` schema is not included: the current product coherently supports sale, and no public copy promises a full exchange platform.
- No paid service, production project, or deployment was authorized by this readiness run.
