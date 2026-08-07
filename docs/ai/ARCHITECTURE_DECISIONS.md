# Current architecture decisions

Updated: 7 August 2026

## ADR-001 — Marketplace launch scope

BookSwap launches as an Azerbaijani-first used-book sale marketplace. Automated exchange, wanted matching, shelves, social reading, advanced edition intelligence, payments, escrow, and shipping are not architectural prerequisites. Existing working sale flows remain intact; unsupported promises are removed.

## ADR-002 — Next.js and Supabase boundaries

Next.js App Router renders the product and owns protected route handlers. Supabase Auth proves identity; protected routes reload the current `public.users` state. Postgres constraints, grants, RLS, triggers, and narrow functions are the final authorization boundary. The service-role key is server-only and never carries a `NEXT_PUBLIC_` prefix.

## ADR-003 — No caller-selected ownership

User, seller, sender, reporter, reviewer, notification, and admin actor identities come from the verified session/current database state. Caller-supplied owner IDs are not mutation inputs. Stale requests are rejected if the token identity no longer matches an active account context.

## ADR-004 — Admin-only launch moderation

The launch model has ordinary users and admins; no privileged moderator role exists. A moderator-labeled ordinary account receives no moderation permission. Admin mutations are server-enforced, reason-bound, transactional, and auditable. A future moderator role requires additive least-privilege policies and matrix tests.

## ADR-005 — Service-only Storage mutation

Listing images are public-read marketplace assets, but browser direct upload/delete policies are removed. The server validates authenticated owner path, random filename, MIME, magic bytes, size, count, dangerous/disguised content, replacement/deletion ownership, and cleanup jobs before using service credentials. Orphan cleanup failures are durable jobs rather than false success.

## ADR-006 — Postgres-backed rate limiting

An atomic fixed-window Postgres function is the durable shared store. Keys are HMAC hashes of actor or trusted platform IP plus scope/resource; raw identity is not stored. Vercel-provided forwarding headers are accepted only inside the platform boundary. Protected mutations fail closed; optional telemetry drops. Route values are documented tuning defaults.

## ADR-007 — Auth security without invented services

Browser Auth uses Supabase platform limits; application-controlled Auth endpoints also use the durable limiter. New/reset passwords require 12 characters in application/local config, errors are generic, reset redirects are same-origin, sessions rotate, and authorization is server-side. Leaked-password protection/admin MFA/CAPTCHA require explicit production owner decisions; no homemade leak database or fake credential is added.

## ADR-008 — Azerbaijani-first localization

The existing centralized TypeScript copy/formatting architecture remains. Public and server-generated content is Azerbaijani-first; stable event keys drive notification localization while legacy English payloads receive Azerbaijani fallbacks. Stored schema enum values remain stable English identifiers and are localized at display boundaries. Search explicitly normalizes Azerbaijani dotted/dotless I.

## ADR-009 — Stable safe errors and provider-neutral logs

Clients receive stable codes and Azerbaijani messages, request correlation IDs, and retry metadata where useful. Stack traces, SQL/policy/provider detail, secrets, authorization headers, full messages, and unnecessary personal data stay server-side and are not logged. JSON logs are provider-neutral until an owner selects retention, alerts, and a destination.

## ADR-010 — Additive migration and forward-fix policy

Previously shared migrations are not rewritten. Corrections are additive, transactional where possible, and verified through static checks, a Docker-capable local reset when available, an authorized empty development project, and Security Advisor. There are no promised automatic down-migrations; reviewed forward-fix is preferred over destructive rollback.

## ADR-011 — Legal drafts preserve unknown facts

The repository provides Azerbaijani launch-draft structure and accessible routes but never invents operator, address, jurisdiction, contact, age, retention, tax, registration, or effective-date facts. Unmistakable placeholders remain hard launch blockers until owner/counsel completion.

## ADR-012 — Production claims require production evidence

Repository procedures do not prove deployment, backups/PITR, restore, MFA, leaked-password protection, CAPTCHA, alerting, provider delivery, field performance, domain, or production authorization. Those statuses remain external until observed in the exact production environment.

## ADR-013 — AI-free launch and free core marketplace

BookSwap has no AI/OpenAI runtime, key, dependency, or external content-classification request. Content safety combines strict boundary validation, a deliberately narrow deterministic credential-theft rule, durable abuse limits, secure upload checks, user reports, admin review/removal/bans, and audit history. These rules do not claim semantic understanding, especially for images. Normal-user listings and messages are free; launch has no commission, integrated payment, VIP listing, subscription, or display ads. Paid listing promotion, professional seller plans, and direct sponsorships remain future candidates only.

## ADR-014 — Owner removal retains listing integrity

`Satıldı` and `Yenidən satışa çıxar` continue to use the existing `sold`/`active` lifecycle. Owner-facing `Elanı sil` does not hard-delete `public.listings`, because the immutable schema cascades that deletion into chat rooms/messages, reviews, favorites, and reports. The protected owner route instead moves the listing to the existing non-public `locked` state, and the owner dashboard excludes that state. This is idempotent, owner-constrained, unavailable to unrelated users, and deliberately leaves listing images attached so retained references do not break. A future verified retention process may hard-delete expired records and drain the existing image-cleanup queue only after legal, moderation, review, report, and conversation retention requirements are satisfied.
