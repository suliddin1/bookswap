# BookSwap security and operations model

Updated: 28 July 2026

## Trust boundaries

1. Browser input is untrusted, including IDs, forwarding headers, image names/URLs, metadata, profile fields, and Supabase `user_metadata`.
2. A valid Auth token proves identity only; every protected route reloads current database account state.
3. Service-role access bypasses RLS. Each service mutation therefore derives the actor from the verified session, checks ownership/state, uses strict allow-listed input, and never accepts a caller-selected owner.
4. Postgres constraints, triggers, grants, RLS, and service-only functions remain the final authorization boundary against direct requests and application mistakes.
5. Public listing images are intentionally readable, but upload/delete/replacement are service-only after signature, MIME, size, count, path, and ownership checks.

## Implemented controls

- Profiles expose only public identity fields; email, phone, role, ban state, privacy requests, moderation metadata, messages, favorites, and notifications are protected.
- Ordinary users cannot update roles or ban state. Admin checks use `public.users.is_admin`, not metadata or hidden UI.
- Listing owner/status, favorite owner, room participant/sender, notification owner, report/review eligibility, privacy-request uniqueness, and banned-account restrictions are enforced in API/database layers as applicable.
- Reviews require a sold listing and matching buyer conversation. Reports cannot target the reporter's own listing or change moderation state.
- Admin moderation/report/privacy/ban mutations use service-only transactional functions and write audit records.
- Durable fixed-window rate limits are atomic in Postgres and keyed by HMAC hashes of actor or trusted platform IP plus action/resource. Vercel forwarding headers are trusted only under the platform boundary; arbitrary local forwarding headers are ignored.
- Protected mutations fail closed with stable Azerbaijani 503/429 errors and `Retry-After`; optional Web Vitals telemetry drops when the limiter is unavailable.
- Auth browser flows use Supabase Auth's platform limits; the application-controlled Auth route also uses the durable limiter. Password/reset copy and local policy require 12 characters, generic errors avoid account enumeration, redirects use the current origin, and roles are never trusted client-side.
- API errors expose no stack, SQL/policy detail, secret, or raw provider message. Unexpected server failures use a correlation ID and structured JSON fields; logs omit passwords, cookies, tokens, authorization headers, service keys, full messages, and raw user content.
- CSP, anti-framing, MIME-sniffing, referrer, permissions, HSTS-in-production, and no-store controls are configured at the application boundary.
- Secret and dependency-baseline checks run in CI. A standalone external `npm audit` remains a separate networked operation and must be approved in the execution environment.

## Content-safety boundary

The launch application makes no AI or external content-classification request and needs no such credential. Text passes strict Zod length/shape validation and one deliberately narrow local rule that rejects requests for CVV/PIN/OTP-style secrets; this is not broad semantic moderation. Images are checked for owner path, count, size, MIME type, and file signature, but their visual meaning is not automatically classified. Durable rate limits, banned-account enforcement, reports, admin review/removal/bans, appeals, and audit history cover abuse the deterministic rules cannot understand.

## Rate-limit policy

Limits are defined at each route by action sensitivity and actor/resource identity. Login/signup/reset use IP/platform protection; listing/upload/chat/report/review/admin operations use authenticated actor and, where useful, target resource. Values are tuning defaults, not immutable policy. Change them only with observed traffic, abuse evidence, false-positive review, and an owner-approved rollback. Raw IP/account IDs are not stored in limiter rows.

## Monitoring boundary and alerts

`lib/server-log.ts` is the provider-neutral boundary. Platform logs are sufficient for local readiness; production must choose retention, access, destination, and alerts without adding a fake DSN.

Minimum alerts and runbooks:

- elevated 5xx or rate-store unavailable → application owner;
- Auth outage/reset delivery failure → identity owner;
- database latency/outage/migration failure → database owner;
- upload signature/storage outage → marketplace owner;
- messaging spam/report flooding → trust-and-safety owner;
- suspected secret leak/account compromise → security/incident commander;
- unusual admin/moderation volume or reversal → moderation owner.

Every alert needs a threshold, evaluation window, destination, primary/backup owner, dashboard/log query, and tested escalation. Repository code does not prove production alerts exist.

## Authentication residual decisions

Leaked-password protection is a paid Supabase option and is not claimed enabled. Compensating controls are length policy, email confirmation, secure reset, rotating sessions, generic errors, durable/application and platform limits, server authorization, and admin-MFA readiness. The production owner must decide on the paid control and enforce MFA for administrators. CAPTCHA remains optional for high-risk anonymous Auth flows and is not configured without provider credentials/privacy/accessibility approval.

## Backup, rollback, and incident handling

See `docs/launch-checklist.md`. Database exports, PITR, Storage copies, restores, Vercel rollback, and secret rotation are owner-run production operations. Migrations use transaction safety and additive forward-fixes; application rollback does not reverse schema or file changes.

## Reproducible checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:database:static
npm run test:dependencies
npm run test:secrets
npm run build
npm run test:performance
npm run test:e2e
supabase db reset
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/launch_readiness.sql
```

Real authorization additionally requires the guarded non-production credentials and `npm run test:authorization`.
