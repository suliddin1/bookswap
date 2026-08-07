# BookSwap engineering compliance status

Updated: 7 August 2026

This repository document is an engineering compliance checklist, not a legal opinion or certification of compliance.

## Resolved in this repository change

- The public legal identity is centralized as `Suliddin Musa Əsədzadə` with legal/privacy contact `Suliddin677@gmail.com`, exactly as approved by the owner. The public-launch guard treats empty, whitespace-only, `[EMAIL]`, and `{{LEGAL_CONTACT_EMAIL}}` values as unconfigured and fails closed; an explicitly enabled private beta may instead render a completion notice.
- `LEGAL_VERSION = "2026-08-07"` is the single source for Terms, Privacy, Marketplace Rules, signup consent, and the audit contract. The effective/updated date is 7 August 2026.
- Azerbaijani Terms, Privacy, and Marketplace/Community Rules now state the 18+ rule, C2C physical-book scope, platform/intermediary role, free current model, no payment/commission/escrow, reporting/takedown, appeal, user-rights, safety, provider, cross-border, retention, and contact boundaries.
- The footer renders the operator, legal/privacy contact, platform-role limitation, and working links for Terms, Privacy, Marketplace Rules, Safety, User Rights, and Moderation Appeals.
- Signup has two separate mandatory controls. Both start unchecked. The first records the 18+ and Terms/Marketplace acceptance; the second records personal-data processing, necessary-provider disclosure, and applicable cross-border consent.
- An additive migration creates `public.legal_acceptances`. The Auth trigger rejects new users missing the current affirmative acceptance metadata, derives the subject from `auth.users.id`, hard-codes the current document versions, and uses a database-authoritative timestamp. Normal users have no insert/update/delete grant and can select only their own row through RLS. Deletion is limited to the server-only service role for verified retention/account-cleanup work; no application route exposes it.
- The existing privacy-request flow now includes explicit consent withdrawal alongside access/information, correction, export, deletion/account closure, objection/restriction, and moderation appeal.
- Tests cover the centralized/fail-closed configuration, current signup schema, unchecked controls, blocked partial signup, trusted payload, legal routes, footer links, migration ACL/RLS contract, privacy requests, and existing private-data boundaries.

## Provider and browser-storage truth audit

- Supabase is used for database, Auth, Storage, and Realtime-capable client infrastructure.
- Vercel is used for hosting/runtime in the documented deployment architecture.
- The repository contains an optional Supabase Edge Function capable of calling Resend, but transactional email configuration and active delivery are not verified. Public policy therefore uses provider-neutral conditional wording and does not claim Resend is active.
- No PostHog, Vercel Analytics, Speed Insights, Sentry, advertising network, or other third-party product analytics package is installed.
- Optional Web Vitals reporting is same-origin, provider-neutral, and omits query strings, metric IDs, user IDs, and session IDs.
- Browser persistence is used for necessary Supabase authentication/session operation. No non-essential tracking was found, so no cookie banner was added.

## External or unresolved items

1. A qualified Azerbaijani lawyer must review and approve the final legal texts and the exact displayed identity/contact form.
2. Applicability and completion requirements for Azerbaijan state registration of the personal-data information system must be formally confirmed.
3. Applicability of the licensed activity concerning formation of personal-data information resources and creation/servicing of information systems must be confirmed with the competent authority.
4. Actual Supabase and Vercel processing and data locations, subprocessor terms, and cross-border safeguards must be externally verified for the deployed configuration.
5. Transactional Auth email delivery must be finalized and tested through signup confirmation and recovery if it remains unresolved.
6. Tax, VÖEN, business-registration, consumer, and regulated-payment analysis must be revisited before any commission, paid promotion, subscription, advertising, professional-seller fee, payment processing, escrow, shipping, or buyer-protection feature goes live.
7. Retention automation must be reconciled with actual logs, moderation/audit operations, account deletion, provider backups, and recovery behavior before broad public data accumulation.
8. The new migration must be applied only to an authorized non-production project first, types regenerated from that resulting schema, Supabase security/performance advisors reviewed, and two-user Auth/RLS behavior exercised. No remote application was authorized in this change.

## Retention enforcement boundary

The public policy records the approved target periods: ordinary technical/security logs up to 90 days, closed moderation/report/appeal records up to 12 months, and minimal consent/privacy-request evidence up to 3 years after closure unless a continuing lawful basis applies. The application does not yet contain a verified automated deletion mechanism covering every database row, runtime log, and provider backup. No unsafe destructive cron or production deletion was introduced. Until the operational mechanism and backup rotation are verified, those periods are policy targets with an explicitly tracked implementation gap, not a claim that every provider copy is already deleted automatically on schedule.
