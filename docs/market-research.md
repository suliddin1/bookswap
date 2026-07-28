# BookSwap market and product research

Research date: 12 July 2026

## Positioning

BookSwap should occupy the gap between a general local classifieds site and a specialist used-book marketplace:

- local discovery and direct buyer/seller messaging;
- book-specific fields such as ISBN, author, condition, edition notes and real-copy photos;
- trust signals tied to completed exchanges;
- a safety and rights layer that general classifieds often leave to generic help pages.

The recommended launch model remains payment-free and reader-to-reader. Adding escrow, delivery or commissions would materially change operations, consumer obligations and dispute handling and therefore requires a separate business decision.

## Products reviewed

### Azerbaijan classifieds

- [Tap.az — books and magazines](https://tap.az/elanlar/hobbi-ve-asude/kitab-ve-jurnallar): strong local reach, location-led discovery and familiar listing behavior. The experience is broad rather than book-specific.
- [Lalafo Azerbaijan — books and magazines](https://lalafo.az/azerbaijan/knigi-zhurnaly-cd-dvd): large classified inventory and direct seller contact, again optimized for general listings.

BookSwap advantage: cleaner book metadata, consistent condition vocabulary, ISBN search, focused discovery and a book-community identity.

### Specialist and global marketplaces

- [PangoBooks terms](https://pangobooks.com/terms): a book-specific marketplace with listing, transaction and community rules. Its model shows the value of explicit seller duties, prohibited content and dispute expectations.
- [Vinted safety](https://www.vinted.com/safety): emphasizes protected communication, account safety, reporting and recognizable fraud patterns.
- [eBay user agreement](https://www.ebay.com/help/policies/member-behaviour-policies/user-agreement?id=4259): mature marketplace separation between platform role and the buyer/seller contract, plus content and account enforcement rules.

BookSwap should borrow the trust patterns, not their operational complexity. Until BookSwap offers integrated payment and delivery, it must not imply buyer protection, escrow or guaranteed refunds.

## Product decisions derived from research

Implemented in this hardening pass:

1. One shared category, city and condition vocabulary.
2. Seller-controlled `active` / `sold` lifecycle.
3. Reviews restricted to buyers with a conversation on a sold listing.
4. Listing reporting with duplicate-open-report protection.
5. Safety center with public-meeting and anti-phishing guidance.
6. Clear platform role in Terms and footer: BookSwap is not the seller, payment processor or delivery provider.
7. Privacy request workflow for access, correction, export, deletion, objection and moderation appeal.
8. Private contact and role fields; only safe seller identity fields are public.
9. Banned users blocked at both API and RLS layers.
10. Server-derived seller identity when opening a conversation.

## Recommended post-beta work

- verified phone/email badges without publishing the underlying values;
- seller response time and completed-exchange reputation;
- ISBN metadata lookup with manual correction;
- saved searches and price/location alerts;
- institution and university filters for textbooks;
- optional delivery only after operational ownership and dispute policy are defined;
- bilingual Azerbaijani/English interface, with Russian considered after user research;
- measured marketplace health: successful contact rate, time to first message, sell-through rate, report rate and repeat listing rate.

## Legal source set used for policy drafting

- [Azerbaijan Law on Personal Data](https://e-qanun.az/framework/19675)
- [Azerbaijan Law on Electronic Commerce](https://e-qanun.az/framework/11850)
- [Official Ministry publication of the Personal Data Law](https://sosial.gov.az/az/qanunvericilik/qanunlar/ferdi-melumatlar-haqqinda-azerbaycan-respublikasinin-qanunu)

The in-product policy text is a product-ready baseline, not a substitute for review by Azerbaijani counsel. Before commercial launch, the real operator/legal-entity name, service address and monitored contact channel must be inserted.
