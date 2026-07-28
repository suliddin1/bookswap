# Azerbaijani-first localization inventory

Updated: 28 July 2026

## Language contract

- Document language: `az`
- Locale: `az-AZ`
- Time zone for application formatting: `Asia/Baku`
- Currency: Azerbaijani manat, displayed with `₼`
- Internal schema enums/events may remain stable English identifiers; all visible labels and generated presentation are localized.

## Audited surfaces

| Surface                                                        | Status                    | Notes/evidence                                                                                         |
| -------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| Metadata, homepage, catalog, listing cards/detail, seller page | Complete                  | Sale/buy promise only; no unsupported automated exchange claim                                         |
| Listing create/edit/upload/status/errors                       | Complete                  | Consistent “elan”, “kitab”, “vəziyyət”, AZN, 1–5/5 MB copy                                             |
| Authentication, reset, loading, empty/destructive states       | Complete                  | 12-character guidance, generic account/recovery wording, accessible error/status focus                 |
| Favorites, chat, reports, reviews                              | Complete                  | Stable Azerbaijani labels/errors; bounded message/review/report input                                  |
| Notifications and optional email                               | Complete                  | Stable event keys; legacy English approval/rejection payloads map to Azerbaijani; user content escaped |
| Profile, privacy requests, deletion/appeal                     | Complete                  | No false success; duplicate request message localized                                                  |
| Admin and moderation                                           | Complete                  | Human actions plus deterministic local-rule states/reasons are localized; no AI/provider promise       |
| Safety, FAQ, Terms, Privacy, Marketplace Rules, appeals        | Draft complete            | Unknown legal facts remain explicit placeholders, not invented translations                            |
| Number/date/time/currency                                      | Complete                  | Azerbaijani display helpers and regression tests; Baku time zone                                       |
| Development seed                                               | Complete                  | Descriptions/review converted to Azerbaijani; original book titles/authors preserved                   |
| Supabase local SMS template                                    | Complete when SMS enabled | Disabled by default; template text is Azerbaijani                                                      |
| Hosted Supabase Auth emails                                    | External                  | Production owner must configure/review Azerbaijani templates in the actual project                     |

## Terminology

| Concept             | Preferred visible term             |
| ------------------- | ---------------------------------- |
| marketplace         | kitab bazarı                       |
| listing             | elan                               |
| used book           | istifadə olunmuş / ikinci əl kitab |
| seller / buyer      | satıcı / alıcı                     |
| handover / delivery | təhvil / çatdırılma                |
| favorites           | seçilmişlər                        |
| report              | şikayət                            |
| review              | rəy                                |
| moderation appeal   | moderasiya qərarına etiraz         |
| account suspended   | hesab dayandırılıb                 |

## Regression expectations

- Important UI/API copy is centralized in `lib/i18n.ts`.
- `formatNotificationPresentation` recognizes stable events and legacy English notification text but never displays raw unknown provider text.
- `private.normalize_az_text('İŞIQ Işıq')` returns `işıq ışıq` in real Postgres.
- Unit tests cover Azerbaijani Auth/API labels, notification/email fallback, escaping, and date/number/currency helpers.
- Browser tests cover public page language, accessibility, and legal page availability.

Native editorial review remains recommended; legal translation approval remains blocked by missing owner facts/counsel.
