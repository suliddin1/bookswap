# BookSwap launch product specification

Updated: 28 July 2026

## Product promise

BookSwap is an Azerbaijani-first marketplace where people list, discover, buy, and sell used books. It connects participants; it does not hold funds, process payments, provide escrow/buyer protection, ship books, or guarantee condition or handover.

## Launch users and outcomes

- A visitor can understand the marketplace/safety model and browse/search/filter public active or sold listings without seeing private account data.
- A registered active seller can publish an accurate book with title, author, condition, price, description, location, and 1–5 real images; then edit, mark sold/relist, or remove it.
- A registered active buyer can save a public listing, open a protected conversation, agree transaction/handover details directly, report problems, and review an eligible completed purchase.
- Each user can manage safe profile fields, notifications, and privacy/deletion/appeal requests.
- An admin can review listings, accounts, reports, privacy/appeal requests, and automated moderation records through server-enforced audited actions.

## Launch-critical functional scope

1. Supabase email/password, magic-link, confirmation/reset/session flows.
2. Catalog search over title, author, description, and ISBN with category, condition, price, location, sort, and cursor pagination.
3. Book identity: title, author, condition, applicable price, seller, city/location, description, images, optional ISBN/category/original price.
4. Owner-only listing lifecycle and service-validated Storage uploads.
5. Owner-only favorites and notification state.
6. Buyer/seller participant-only chat with forged-sender prevention and bounded input/history.
7. Sold-listing buyer review eligibility, duplicate/rating/comment constraints.
8. Authenticated reports, private moderation metadata, admin-only audited resolution.
9. Privacy access/correction/export/deletion/objection/appeal workflow.
10. Azerbaijani-first UI/generated messages, safety guidance, legal drafts, stable errors, rate limits, and operational foundations.

## Listing and marketplace rules

- Title 2–140; author 2–100; description 10–2000; ISBN optional <=20.
- Price is positive and <=10,000 AZN; original price, if present, is 0.01–10,000.
- Exactly 1–5 unique public image URLs; upload accepts JPEG/PNG/WebP up to 5 MB after MIME and signature validation.
- Category, condition, and city use existing allow-listed values; display values are localized.
- Only active listings appear as available. Sold listings may remain public for lifecycle/review context. Draft/locked/removed content follows protected/admin visibility.
- Seller identity is public only to the limited marketplace projection; email, phone, roles, bans, and private workflows are not public.

## Trust and transaction model

Users verify condition, price, counterpart, payment method, meeting, optional delivery, and handover. Fraud, harassment, illegal/stolen/counterfeit/pirated material, prohibited content, sensitive-data abuse, spam, unsafe links/files, and manipulation are forbidden. Users can report content/accounts and appeal moderation decisions. Chat warns against unnecessary sensitive information. Minor usage remains a legal owner decision.

## Non-functional launch requirements

- Server/database authorization, no IDOR/mass assignment/forged owner or role trust.
- Durable shared rate limits and stable Azerbaijani errors with retry information.
- Safe structured logs/correlation IDs, security headers, bounded uploads/inputs/pagination, no private public caching.
- Strict TypeScript, lint/format/unit/database/E2E/build/performance/secret/dependency gates.
- Accessible keyboard/focus/semantic behavior and responsive mobile/desktop layouts.
- Actionable backup/rollback/incident/secret-rotation procedures with honest production verification boundaries.

## Explicitly post-launch

- `sale/exchange/both` intention and direct exchange workflow;
- automated exchange or wanted-title matching;
- owned/read/custom/wanted shelves and social reading;
- complete edition/publisher/bibliographic intelligence;
- external paid search;
- integrated payments, escrow, shipping, delivery, or buyer protection;
- product analytics beyond explicitly approved privacy-minimized operational Web Vitals.

These items must not be presented as unresolved MVP blockers or current public promises.
