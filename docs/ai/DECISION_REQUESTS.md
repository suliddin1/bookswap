# Owner decisions and external actions

Updated: 28 July 2026

Only facts or authority that cannot be derived safely from the repository remain here. Exchange matching, wanted titles, reader shelves, and social reading are intentionally post-launch and require no launch decision.

## DR-001 — Complete real development authorization verification

Status: launch-blocking; engineering preparation complete.

The ignored `.env.local` now points to the intended active `bookswap-development` project (`uibatsbzjswmtdvdrlxj`) and has a valid public key. The service-role secret is not available. The guarded matrix in `tests/authorization.integration.test.ts` refuses any other project, creates temporary actors, exercises anonymous/owner/unrelated/banned/moderator/admin/stale-account behavior, and removes its fixtures.

Exact owner action (PowerShell, from the repository root):

```powershell
Copy-Item .env.test.example .env.test.local
# In .env.test.local, paste the ACTIVE bookswap-development public key and
# service-role key from Supabase Dashboard > Project Settings > API.
# Do not paste either value into chat, Git, screenshots, logs, or documentation.
npm.cmd run test:authorization
```

Keep these exact non-secret lines unchanged:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://uibatsbzjswmtdvdrlxj.supabase.co
BOOKSWAP_REMOTE_TEST_CONFIRMATION=bookswap-development
```

Acceptance: the command exits 0 and reports the complete real-backend matrix. A mocked UI test is not a substitute.

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

## DR-004 — Production operations ownership

Status: production/deployment-only.

Name the production Supabase/Vercel projects, domain, region/data-residency decision, deployment approver, incident commander, on-call/alert destination, log owner/retention, backup retention, restore target, support/privacy mailbox owners, moderation SLA, and secret-rotation owner. Verify backups and restore in production; repository procedures are not proof that either is enabled.

## DR-005 — Optional provider credentials

Status: production/deployment-only unless the feature is enabled.

- Choose and configure a real error-monitoring/log destination, or retain provider-neutral structured platform logs.
- Provide moderation credentials only if external automated moderation is approved; local rules remain available and provider failure stays fail-closed for protected content.
- Provide Resend credentials only if notification email is enabled and templates/privacy/retention are approved.
- Enable `WEB_VITALS_ENABLED=true` only after log access, retention, alert queries, and privacy scope are approved.

No fake DSN, token, or API key may be committed.

## Resolved product decisions

- Launch MVP: Azerbaijani-first used-book listing, discovery, buying, and selling.
- Payment, escrow, shipping, delivery, and handover are participant responsibilities.
- Automated exchange matching, wanted-title matching, shelves, social reading, and edition intelligence are post-launch.
- A dedicated `sale/exchange/both` schema is not included: the current product coherently supports sale, and no public copy promises a full exchange platform.
- No paid service, production project, or deployment was authorized by this readiness run.
