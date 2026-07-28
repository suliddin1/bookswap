# BookSwap

BookSwap is an Azerbaijani-first, mobile-friendly marketplace for listing, discovering, selling, and buying used books. It uses Next.js 15 and Supabase for authentication, Postgres data, protected server-side uploads, authorization, and Realtime conversations.

## Product flows

- Email/password registration, login, logout, magic link, and password reset through Supabase Auth
- Real-listing catalog with search, category, condition, price, and location filters
- Listing create, edit, and delete operations owned by the authenticated seller
- One to five listing images uploaded to Supabase Storage, limited to 5 MB each
- Favorites stored per authenticated reader
- Protected profiles and personal listings
- Buyer/seller chat with protected room membership and Realtime updates
- Admin-only listing moderation, user banning, and report counts
- Seller-controlled sold/relist lifecycle, buyer reviews, listing reports, and notifications
- Privacy requests for access, correction, export, deletion, objection, and moderation appeal
- Azerbaijani-first marketplace, safety, privacy, legal-draft, and moderation-appeal surfaces
- Installable PWA manifest, theme colors, and app icon

There is intentionally no payment, escrow, shipping, automated exchange matching, wanted-list, or social-shelf system in the launch MVP. Buyers and sellers agree payment and handover directly.

Normal-user listings and messages are free at launch. BookSwap takes no commission and has no integrated payment, VIP listing, subscription, or display-ad product. Paid listing promotion, professional seller plans, and direct sponsorships are future business candidates only; none is implemented or promised for launch.

## Local setup

```bash
npm install --cache .npm-cache
copy .env.local.example .env.local
supabase db reset
npm run dev
```

Add the required Supabase values to `.env.local`, then open [http://localhost:3000](http://localhost:3000).

Without valid Supabase variables, public pages still render their premium layout but production flows show honest configuration or empty states. They never create fake users, listings, favorites, or messages.

## Required environment

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BOOKSWAP_REMOTE_TEST_CONFIRMATION=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
WEB_VITALS_ENABLED=false
RESEND_API_KEY=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` or other secret keys to client components.

`WEB_VITALS_ENABLED=true` must be set at build and runtime only for an
authorized production environment. It enables privacy-minimized LCP, CLS, and
INP events for the public marketplace route groups; it does not enable product
analytics or an external provider. See the launch checklist for the field
evidence gate.

## Supabase

The migrations create profiles, listings, favorites, rooms, messages, reviews, notifications, reports, RLS policies, search indexes, Realtime publications, and the `listing-images` bucket.

The latest hardening migrations add database validation constraints, review/report/chat invariants, Azerbaijani-aware search normalization, service-only Storage mutation, stable Azerbaijani notifications, and an atomic Postgres-backed rate limiter. Apply all 22 migrations in filename order.

The first administrator is a production-owner bootstrap operation, not an application flow. Perform it only in the intended project, record the operator/ticket, and then use audited admin actions for subsequent changes:

```sql
update public.users set is_admin = true where email = 'admin@example.com';
```

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:database:static
npm run test:dependencies
npm run test:secrets
npm run build
npm run test:performance
npm run test:e2e
```

Real development authorization tests additionally require `.env.test.local` with the exact `bookswap-development` URL, its public key, its service-role key, and `BOOKSWAP_REMOTE_TEST_CONFIRMATION=bookswap-development`. Run `npm run test:authorization`; the preflight refuses any other project and never prints values.

## Security model

- Public seller identity is limited to name, city, account creation date, and ID. Email, phone, ban state, and admin state are private.
- Authenticated API calls are revalidated with Supabase Auth and the current database ban/admin state.
- The browser never chooses a chat seller; the API derives the seller from the listing.
- Service-role credentials are server-only and must never use a `NEXT_PUBLIC_` prefix.
- Uploaded images are limited by count, size, MIME type, file signature, random filename, and authenticated owner folder.
- User-generated email content is HTML-escaped.
- Marketplace mutations use strict Zod schemas and a concurrency-safe Postgres-backed rate limiter shared across server instances. Protected actions fail closed if the durable store is unavailable; optional Web Vitals telemetry is dropped.
- The database remains the final authorization layer through RLS and column-level privileges.

See [docs/security-model.md](docs/security-model.md), [docs/market-research.md](docs/market-research.md), and [docs/launch-checklist.md](docs/launch-checklist.md).
