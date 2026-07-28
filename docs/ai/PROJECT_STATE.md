# BookSwap project state

Updated: 28 July 2026

## Current verdict

**Not production-ready; conditionally non-deployment ready.** All identified safe repository-side launch-critical work is implemented, and the guarded real development authorization matrix passes. The remaining non-deployment launch blocker is owner/counsel-supplied legal facts and approval. The production gate was inspected on 28 July 2026 and failed before migration or deployment because backup/restore evidence, migration-history reconciliation, hosted Auth settings, required environment values, operational ownership, and post-deploy verification are incomplete. External AI/moderation credentials are no longer part of the product or launch gate.

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

- Intended project: `bookswap-development`
- Project ref: `uibatsbzjswmtdvdrlxj`
- Region/status: `eu-central-1`, active/healthy at verification time
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

- Intended production Supabase project: `bookswap`, ref `lnhublqrtkdrrafghvki`, `eu-central-1`, active/healthy, PostgreSQL 17.6. It is separate from `bookswap-development`.
- The currently published Vercel production bundle embeds that production ref, which corroborates the environment classification without exposing a key. It is the old deployment `dpl_3YJ15xSUXwLvT82Q2ZDc8E9BRR7f` from source SHA `941b0c75c0a952c3d68d4a0dee4a1fad541107e4`; no deployment exists for merged SHA `cf126c3...`.
- Current production aliases are Vercel-managed only: `bookswap-fawn.vercel.app`, `bookswap-suliddin1s-projects.vercel.app`, and `bookswap-git-main-suliddin1s-projects.vercel.app`. No custom launch domain was observed. Vercel Git remains disconnected.
- Production database migration history contains 2 legacy entries while the repository contains 22 ordered migrations. The production schema has 8 public RLS tables rather than the 13-table launch schema. Migration baselining must be reconciled before applying the remaining additive migrations.
- Production is not empty: one Auth identity and one matching public profile exist. No production fixture was created, inspected, changed, or removed.
- The `listing-images` bucket exists as public-read with the expected 5 MiB JPEG/PNG/WebP limits, but production still has two Storage object policies rather than the launch architecture's service-only mutation posture.
- Production Security Advisor reports leaked-password protection disabled. Hosted Site URL, redirect allow-list, confirmation, password/session settings, admin MFA, network/SSL controls, and Auth email delivery were not available through the current read-only connector and are not claimed verified.
- The Supabase organization is on the Free plan. No downloadable backup, PITR, encrypted logical export, Storage-object copy, or successful isolated restore was evidenced. Because production contains an account, no migration was attempted.
- Required Vercel Production variable names are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SITE_URL`. `WEB_VITALS_ENABLED` is opt-in. Optional notification email additionally requires a deployed `notify` Edge Function and its own `RESEND_API_KEY`; neither project currently has that function deployed.
- Listing and chat safety checks are repository-local and require no external AI key. Production variable scopes/roles were not readable through the available platform connector, so completeness of the remaining required values is not claimed.
- Vercel had no grouped runtime errors in the prior seven days and one observed production 200 response. This is not alerting, retention, uptime, or incident-ownership evidence.
- Deployment gate result: **failed safely**. No migration, Auth/Storage setting change, environment mutation, Git reconnection, production deployment, production authorization fixture, or rollback was performed.

## Validation snapshot

- Strict TypeScript: pass
- Unit/adversarial tests: 59/59 pass
- Development environment identity and credential-role/project guard: pass without printing values
- Migration static check: 22 migrations pass
- Dependency patched-version baseline: 7/7 pass
- Secret scan: 189 repository files pass
- Development database structural/behavioral checks: pass
- Format/lint/strict TypeScript: pass
- Production build: pass, 39/39 static pages generated
- Bundle budgets: 5/5 pass
- Chromium browser/E2E: 28/28 pass
- Real multi-actor backend authorization: 10/10 pass against `uibatsbzjswmtdvdrlxj`; temporary fixtures cleaned

## Remaining external requirements

Launch blockers:

1. owner supplies legal identity/contact/age/retention/appeal facts, replaces placeholders, and obtains qualified counsel approval.

Production/deployment-only requirements include project/domain/environment configuration, Auth dashboard controls and leaked-password decision, admin MFA enforcement, backup/restore evidence, alert routing, field performance, deployment, and production smoke/authorization verification. Optional email/CAPTCHA/telemetry services may remain disabled.

Exact actions are in `docs/ai/DECISION_REQUESTS.md`; prioritized status is in `docs/ai/ISSUE_QUEUE.md`.
