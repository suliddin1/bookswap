# BookSwap project state

Updated: 28 July 2026

## Current verdict

**Conditionally non-deployment ready.** All identified safe repository-side launch-critical work is implemented, and the guarded real development authorization matrix passes. The remaining non-deployment launch blocker is owner/counsel-supplied legal facts and approval. Deployment/production operations remain separate and unverified.

## Authoritative workspace and Git baseline

- Writable repository: `C:\Users\Lenovo\Documents\2HandedBook`
- Source restored from: `D:\Codex Projects\2HandedBook` (D was read-only and is not modified)
- Branch: `autonomous/bookswap-product`
- Continuation baseline: `5e36c584ca12780226f8b18ae7876335a0bbe82f`
- Integration baseline: fetched `origin/main` at `941b0c75c0a952c3d68d4a0dee4a1fad541107e4`
- Readiness history: inspect `git log --oneline 5e36c58..HEAD`

## Launch product scope

The MVP is an Azerbaijani-first used-book marketplace for listing, discovering, selling, and buying books. Launch-critical flows are Auth, listings, search/filter, protected image upload, favorites, buyer/seller chat, sold/relist lifecycle, eligible reviews, reports, notifications, privacy requests, moderation/admin controls, safety/legal pages, and stable error behavior.

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

## Validation snapshot

- Strict TypeScript: pass
- Unit/adversarial tests: 61/61 pass
- Development environment identity and credential-role/project guard: pass without printing values
- Migration static check: 22 migrations pass
- Dependency patched-version baseline: 7/7 pass
- Secret scan: 189 repository files pass
- Development database structural/behavioral checks: pass
- Format/lint/strict TypeScript: pass
- Production build: pass, 40/40 static pages generated
- Bundle budgets: 5/5 pass
- Chromium browser/E2E: 28/28 pass
- Real multi-actor backend authorization: 10/10 pass against `uibatsbzjswmtdvdrlxj`; temporary fixtures cleaned

## Remaining external requirements

Launch blockers:

1. owner supplies legal identity/contact/age/retention/appeal facts, replaces placeholders, and obtains qualified counsel approval.

Production/deployment-only requirements include project/domain/environment configuration, Auth dashboard controls and leaked-password decision, admin MFA enforcement, backup/restore evidence, provider credentials, alert routing, field performance, deployment, and production smoke/authorization verification.

Exact actions are in `docs/ai/DECISION_REQUESTS.md`; prioritized status is in `docs/ai/ISSUE_QUEUE.md`.
