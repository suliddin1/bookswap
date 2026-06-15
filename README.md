# BookSwap

BookSwap is a premium, mobile-friendly marketplace for pre-loved books and textbooks. It uses an editorial private-library design, real Supabase authentication and data, Supabase Storage uploads, protected favorites, admin roles, and Realtime conversations.

## Product flows

- Email/password registration, login, logout, magic link, and password reset through Supabase Auth
- Real-listing catalog with search, category, condition, price, and location filters
- Listing create, edit, and delete operations owned by the authenticated seller
- One to five listing images uploaded to Supabase Storage, limited to 5 MB each
- Favorites stored per authenticated reader
- Protected profiles and personal listings
- Buyer/seller chat with protected room membership and Realtime updates
- Admin-only listing moderation, user banning, and report counts
- Installable PWA manifest, theme colors, and app icon placeholders

There is intentionally no payment or Stripe integration in this version.

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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=
RESEND_API_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` or other secret keys to client components.

## Supabase

The migrations create profiles, listings, favorites, rooms, messages, reviews, notifications, reports, RLS policies, search indexes, Realtime publications, and the `listing-images` bucket.

Make an admin through the Supabase SQL editor:

```sql
update public.users set is_admin = true where email = 'admin@example.com';
```

## Verification

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```
