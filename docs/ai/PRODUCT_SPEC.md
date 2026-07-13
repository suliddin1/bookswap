# BookSwap product specification

Status: approved direction for autonomous product development; current implementation must be evolved, not rebuilt.

## Product statement

BookSwap is Azerbaijan's book-specific reader marketplace, combining physical-book sales, local exchange, reader shelves, wanted-book lists, and direct communication. Its advantage over a generic classified category is structured book discovery and reader-to-reader matching.

The service does not currently promise integrated payment, platform-controlled shipping, buyer protection, delivery guarantees, or insurance. Users arrange payment, meeting, handoff, or optional delivery directly and must see accurate trust language.

## Target users and problems

- Students need affordable textbooks and a fast way to resell prior-course books.
- Readers need a book-native place to pass on finished books or exchange them instead of buying.
- Azerbaijani readers need useful discovery across Azerbaijani, Russian, and English inventory.
- Collectors need edition, publication, condition, and ISBN detail that generic listings omit.
- Parents need a practical way to rotate children's books locally.
- Exchange-first readers need wanted-book matching without exposing private information.

Generic classifieds provide local reach but weak book metadata, reader identity, shelves, wanted titles, and exchange matching. International book marketplaces offer richer book culture but import unsuitable shipping, payment, and commercial assumptions.

## Mandatory launch capabilities

1. Authentication and recovery with safe session handling and an automatically created public profile.
2. Editable reader profiles and public seller pages with active/sold seller listings and trust context.
3. Fast physical-book listing creation, editing, state changes, and deletion.
4. Listing intention: sale, exchange, or sale-or-exchange.
5. Structured essentials: title, author, language, condition, city/region, description, copy photos, intention, and price when sale is enabled.
6. Optional metadata: genre, publisher, publication year, edition, ISBN, cover type, annotations/highlighting, missing/damaged pages, negotiability, approximate area, handoff preferences, and desired exchange titles.
7. Secure image upload, replacement, removal, failed-create cleanup, and listing-delete cleanup.
8. Book-first catalog, search, filters, sorting, stable cursor pagination, and responsive browsing.
9. Saved physical listings plus saved book titles, reader shelves, and wanted-book lists.
10. Privacy-preserving potential exchange matching from owned/offered and wanted titles.
11. Direct buyer/seller messaging with membership authorization, unread state, and notifications.
12. Reviews tied to eligible completed interactions.
13. Reporting, moderation, bans, admin authorization, and durable admin audit history.
14. Azerbaijani-first interface, metadata, validation, empty/error states, and legal/trust copy.
15. Production-quality RLS, grants, Storage policies, service-role checks, monitoring, tests, responsive accessibility, SEO, and deployment configuration.

Existing authentication, profiles, sale listings, catalog, favorites, chat, notifications, reviews, reporting, admin, legal pages, security migrations, and tests are the foundation. Work should close verified gaps without discarding those flows.

## Optional capabilities

- ISBN/barcode-assisted metadata entry with user confirmation.
- Public or private custom shelves beyond owned/read/wanted.
- Price-drop and wanted-title availability alerts.
- Same-seller bundles and multi-book negotiation.
- Approximate-distance matching without precise-location disclosure.
- Reader/storefront curation, follow relationships, and recommendations.
- Delivery preference fields and neutral handoff planning.

Optional items must not delay secure, understandable core sale/exchange flows.

## Non-goals for the current product phase

- Integrated checkout, escrow, wallets, commission collection, refunds, or payment guarantees.
- Platform-controlled labels, couriers, shipping insurance, or guaranteed delivery.
- Importing PangoBooks' US logistics or Vinted's buyer-protection/payment system.
- General merchandise categories, ebooks/PDF trading, or copyright-infringing digital content.
- Broad social networking, gamification, or an unrelated visual redesign.
- Exact-address publication or exposing private wanted/ownership data during exchange matching.

## Primary journeys

### Discover and buy

A signed-out or signed-in reader opens an Azerbaijani catalog, searches by title/author/ISBN, filters language/genre/condition/location/intention/price, pages through stable results, opens a physical-copy detail page, reviews seller context, saves the listing or title, signs in if needed, and starts an authorized conversation.

### Sell a book

A reader signs in, creates a listing quickly, chooses sale or sale-or-exchange, adds actual copy photos and honest condition/flaw details, optionally adds richer metadata and negotiability, previews, publishes, edits or replaces photos, marks sold, and later deletes with storage cleanup.

### Exchange books

A reader records owned/offered books and wanted titles, publishes an exchange or sale-or-exchange copy, receives a privacy-safe potential match, reviews only public listing/profile context, opens a protected conversation, and arranges a local handoff. Matching never reveals a private shelf, precise location, email, or phone.

### Build a reader identity

A reader maintains public profile basics, seller inventory, saved listings, saved titles, and shelves with explicit privacy. A public seller page shows only allowed fields and eligible listings.

### Trust and moderation

A user sees honest safety guidance, reports a listing/user interaction, tracks permitted report state, and can appeal or exercise privacy rights. An authorized admin reviews evidence, takes bounded action, and creates an immutable audit record.

## Trust model

BookSwap facilitates discovery and communication; users arrange transactions. Trust comes from verified account state, structured copy descriptions, actual photos, public seller history, eligible reviews, reporting/moderation, transparent listing states, privacy minimization, and accurate safety guidance—not fabricated protection.

Required communication must state that BookSwap does not currently hold funds, guarantee condition/delivery, insure exchanges, or verify every claim. Sensitive contact and location data remain private by default.

## Exchange model

- A copy has one intention: sale, exchange, or both.
- Sale requires a positive AZN price; exchange-only does not invent a price.
- Wanted items should resolve to a book/title identity where possible while permitting free-text fallback for uncommon editions.
- A two-way candidate exists when A offers X and wants Y while B offers Y and wants X. Edition/language/condition/location preferences may refine ranking but should not silently exclude viable matches.
- A match is a suggestion, not a reservation or guarantee.
- The first disclosure should contain public book/listing/profile facts and approximate location only. Each user decides whether to message and disclose more.
- Dismissal/block/report signals must suppress unsuitable repeats.

## Design direction

Preserve the current Fraunces/Manrope typography, ivory/paper/walnut/near-black/brown/restrained-gold palette, warm bookstore atmosphere, shelf catalog, cover fallbacks, card language, header/footer, responsive grid, and existing state vocabulary. Improve only evidence-backed accessibility, hierarchy, consistency, responsiveness, and interaction issues. Product references inform behavior, not appearance.

## Localization standards

- Default locale and document lang: Azerbaijani (az).
- Correct Azerbaijani spelling and characters; no machine-like literal translations.
- Book language values include Azerbaijani, Russian, English, and extensible other languages.
- Money is displayed in AZN with consistent numeric formatting.
- Location uses Azerbaijani city/region terminology; approximate area is optional and precise address is private.
- All navigation, forms, validation, moderation, trust, legal, metadata, empty/error/loading states, emails, and notifications require Azerbaijani coverage before launch.
- User-entered titles/authors/descriptions remain in their entered language.

## Launch requirements

Launch requires every launch-required acceptance criterion to be Pass; zero open P0/P1 issues; a healthy dedicated production backend separate from development; reviewed migrations and generated types; verified RLS/grants/Storage/Realtime/service-role behavior; successful buyer/seller/admin browser journeys; Azerbaijani-first UX; accessible four-viewport behavior; no core console/network errors; production secrets, domain, monitoring, backups, abuse controls, legal operator/contact details, privacy process, and rollback runbook. A build passing by itself is not launch readiness.
