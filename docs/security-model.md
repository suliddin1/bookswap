# BookSwap security model

Updated: 12 July 2026

## Trust boundaries

1. Browser input is untrusted, including IDs, image URLs, profile fields and Supabase `user_metadata`.
2. A valid access token proves a Supabase Auth identity, not that the account is currently allowed to act.
3. The service-role client bypasses RLS; every service-role mutation therefore performs explicit identity, ownership and state checks.
4. Database RLS and column grants protect against direct Data API access and application mistakes.

## Key controls

- `requireUser` validates the bearer token, loads current database role state and rejects suspended accounts.
- `requireAdmin` uses the database `is_admin` value, never editable `user_metadata`.
- `users` grants expose only safe public columns and allow authenticated users to update only `name`, `phone`, and `city`.
- Listing policies require an active, non-banned seller.
- Chat creation derives `seller_id` from an active listing and forbids self-conversations.
- Reviews require a buyer conversation and a sold listing in both API logic and RLS.
- Reports are length-limited and one open report per reporter/listing is allowed.
- Image URLs must point to the authenticated user's own Supabase Storage folder.
- API errors hide internal 5xx details and validation responses have stable codes.
- Baseline CSP, anti-framing, MIME sniffing, referrer and permissions headers are set globally.

## Known infrastructure requirements

- In-memory throttling is defense-in-depth only. Multi-instance production requires Redis/KV or an edge rate-limit service.
- Supabase Auth CAPTCHA and email rate limits should be enabled in the new project dashboard.
- Short JWT expiry, leaked-password protection, MFA for administrators and database backups must be configured operationally.
- Run Supabase security/performance advisors after applying migrations. The current workstation has no Docker and the old Supabase project no longer resolves, so a live advisor run is pending infrastructure recreation.

## Verification commands

```bash
npm ci
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
supabase db advisors
```
