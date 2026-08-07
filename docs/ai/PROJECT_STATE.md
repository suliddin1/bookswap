# BookSwap project state

Updated: 7 August 2026

## Current verdict

**Not public-launch ready.** The owner supplied the public operator identity and legal/privacy contact on 7 August 2026, and the safe repository-side legal copy, separate signup consent, centralized version, footer disclosure, fail-closed public configuration, and additive auditable-consent migration are implemented. Qualified legal review, external regulatory/provider-location determinations, retention operations, non-production migration application/type regeneration/advisors/two-user proof, and the existing production/deployment gates remain unresolved. No production or remote system was mutated by this legal slice.

## Authoritative workspace and Git baseline

- Writable repository: `C:\Users\Lenovo\Documents\2HandedBook`
- Source restored from: `D:\Codex Projects\2HandedBook` (D was read-only and is not modified)
- Branch: `autonomous/bookswap-product` (the merged tree is identical to `origin/main`; production-gate evidence is being prepared as a follow-up PR)
- Continuation baseline: `5e36c584ca12780226f8b18ae7876335a0bbe82f`
- Merged `main`: `cf126c3c4a408007eacf7d337f485be69e23517c` (PR #1 squash merge; GitHub Actions passed)
- Readiness history: inspect `git log --oneline 5e36c58..HEAD`

## Launch product scope

The MVP is an Azerbaijani-first used-book marketplace for listing, discovering, selling, and buying books. Launch-critical flows are Auth, listings, search/filter, protected image upload, favorites, buyer/seller chat, sold/relist lifecycle, eligible reviews, reports, notifications, privacy requests, moderation/admin controls, safety/legal pages, and stable error behavior.

Normal-user listings and messages are free at launch. There is no commission, integrated payment, VIP listing, subscription, or display advertising. Paid listing promotion, professional seller plans, and direct sponsorships are unimplemented future candidates, not launch promises.

Automated exchange matching, wanted-title matching, reader shelves, social reading, and advanced edition/bibliographic intelligence are post-launch. A `sale/exchange/both` model was not added because the current schema/UI coherently implement sale and the public promise does not claim an automated exchange platform.

## Implemented launch-readiness work

- Centralized legal identity and `2026-08-07` document version across Terms, Privacy, Marketplace/Community Rules, footer, and signup; private beta tolerates missing identity while explicit public configuration fails closed.
- Two separate unchecked signup affirmations and a trusted Auth flow carrying exact versions/consents to an additive `legal_acceptances` audit contract with database identity/time, own-row read-only RLS, and no normal-user mutation grant.
- Explicit privacy-request support for consent withdrawal; provider/storage audit records Supabase and Vercel, conditional transactional email, same-origin operational Web Vitals, and no non-essential tracking/banner.

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
- AI-free content safety: deterministic boundary validation, one narrow credential-theft text rule, durable rate limits, existing upload checks, user reporting, admin review/removal/ban/audit, and no external content-classification request. Image content is not claimed to be semantically understood.

## Development Supabase status

- The guarded authorization environment is a dedicated, healthy non-production project.
- Public local URL/key: correct and guarded; ignored `.env.local` is not committed
- Service-role test key: available only in ignored `.env.test.local`; verified as `service_role` for the intended project and not committed
- Remote migrations: 22, including both 28 July hardening migrations
- Data: temporary authorization fixtures were cleaned; no production data was used
- Security Advisor after migration: zero findings
- Structural SQL: public tables without RLS = 0; launch constraints/indexes present; browser Storage mutation policies = 0; anon/authenticated rate-RPC execute = false; service-role execute = true; fixed search path present
- Real limiter behavior: allow/allow/deny at threshold 2; retry value valid; fixture removed
- Generated TypeScript type for `consume_rate_limit`: matches `lib/database.types.ts`

Local `supabase db reset` remains unexecuted on this workstation because Docker/Podman and `psql` are absent. `supabase/config.toml`, corrected seed ordering, and `supabase/tests/launch_readiness.sql` are prepared. The actual migrations were nevertheless executed successfully on the authorized empty development backend.

## Observed production infrastructure gate

- The intended production database and hosting projects are separate from the guarded development environment.
- The currently published release predates the launch-readiness branch. Vercel Git remains disconnected, no custom launch domain is verified, and this repository change does not promote a release.
- Production migration history and schema have not been reconciled with the immutable repository migrations. Production is not disposable, so blind migration pushes and resets are prohibited.
- Storage ownership policy alignment, hosted authentication configuration, administrator MFA, leaked-password protection, network controls, and email delivery require owner verification.
- Backup availability, encrypted export, Storage backup, and successful isolated restore evidence remain incomplete. No migration may proceed until the recovery gate is satisfied.
- Production environment variables must be verified by name, scope, and role without copying values into public records. Listing and chat safety require no external AI key.
- Alert routing, retention, uptime evidence, incident ownership, canonical domain, and post-deploy verification remain incomplete.
- Deployment gate result: **failed safely**. No migration, Auth/Storage setting change, environment mutation, Git reconnection, production deployment, production authorization fixture, or rollback was performed.

## Validation snapshot

- Strict TypeScript: pass
- Unit/adversarial tests: 59/59 pass
- Development environment identity and credential-role/project guard: pass without printing values
- Migration static check: 22 migrations pass
- Dependency patched-version baseline: 7/7 pass
- Secret scan: 188 repository files pass
- Development database structural/behavioral checks: pass
- Format/lint/strict TypeScript: pass
- Production build: pass, 39/39 static pages generated
- Bundle budgets: 5/5 pass
- Chromium browser/E2E: 29/29 pass, including isolated authenticated privacy hydration readiness and cross-identity profile/privacy coverage
- Real multi-actor backend authorization: 10/10 pass against `uibatsbzjswmtdvdrlxj`; temporary fixtures cleaned

## Remaining external requirements

Launch blockers:

1. owner supplies legal identity/contact/age/retention/appeal facts, replaces placeholders, and obtains qualified counsel approval.

Production/deployment-only requirements include project/domain/environment configuration, Auth dashboard controls and leaked-password decision, admin MFA enforcement, backup/restore evidence, alert routing, field performance, deployment, and production smoke/authorization verification. Optional email/CAPTCHA/telemetry services may remain disabled.

Exact actions are in `docs/ai/DECISION_REQUESTS.md`; prioritized status is in `docs/ai/ISSUE_QUEUE.md`.
