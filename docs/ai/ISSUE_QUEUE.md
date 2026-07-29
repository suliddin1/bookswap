# Launch-readiness issue queue

Updated: 29 July 2026

This queue contains only unresolved work. Completed repository work is summarized in `PROJECT_STATE.md` and evidenced in `QA_EVIDENCE.md`.

## True launch blockers

| ID      | Owner                                   | Blocker                                                                    | Repository preparation                                                                                                                                                                | Completion evidence                                                                                      |
| ------- | --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| EXT-002 | Product/legal owner + qualified counsel | Legal operator/contact/jurisdiction/age/retention/appeal facts are unknown | Azerbaijani Terms, Privacy, Marketplace Rules, Safety, prohibited-content, reporting, appeals, transaction responsibility, and deletion drafts complete with centralized placeholders | All placeholders replaced, counsel approval/date/version recorded, routes visually/accessibly reverified |

## Production/deployment-only blockers

| ID       | Owner action                                                                                                                                                                                        | Why repository code cannot close it                                                                                                                                     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PROD-001 | On a verified isolated restore, replace the two legacy history versions with canonical migrations 1–3 and rehearse exactly the remaining 19 migrations; only then approve production reconciliation | Fingerprints/classification/runbook are prepared, but no restore, history repair, dry run, migration application, or post-migration verification has run                |
| PROD-002 | Verify hosted Site URL/redirects, confirmation, 12-character password policy, secure changes, limits, leaked-password decision, and enforced admin MFA                                              | Only the disabled leaked-password warning is observed; remaining dashboard settings are unverified                                                                      |
| PROD-003 | Create/checksum an encrypted off-project database backup with managed Auth coverage and a separate Storage inventory/copy; restore it in isolation and measure RPO/RTO                              | No archive was created; CLI/PostgreSQL tools, DB connection secret, encrypted destination, supported Auth recovery path, and approved clean target are unavailable here |
| PROD-004 | Verify Vercel Production variables by name/scope/role and set the canonical origin/domain without exposing values                                                                                   | Production environment completeness and the custom launch domain are unverified                                                                                         |
| PROD-006 | Name log retention, uptime/alert destinations, incident owners, and on-call test; then run post-deploy smoke, authorization, accessibility, and performance checks                                  | Seven-day Vercel runtime query is clean but proves neither alerting nor launch behavior                                                                                 |

## Strong pre-launch recommendations

| ID      | Recommendation                                                                                                     | Status                                                                                                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRE-001 | Run `supabase db reset` and both SQL test scripts on a Docker-capable workstation                                  | Prepared; local tool unavailable here                                                                                                                                                                           |
| PRE-002 | Monitor and remove the legacy ESLint `brace-expansion` advisory when a compatible upstream release exists          | Live audit triaged: production-only tree 0; full tree 13 high entries from one development-only DoS advisory. No compatible 1.x fix exists; unsafe 5.x override rejected and the exact dev-only path is guarded |
| PRE-003 | Conduct manual Azerbaijani editorial review with native marketplace/legal context                                  | Engineering localization pass complete                                                                                                                                                                          |
| PRE-004 | Exercise backup restore, failed migration, credential leak, accidental moderation, and account compromise tabletop | Detailed migration/recovery runbook and fingerprint/precondition guards prepared; owner exercise pending                                                                                                        |

## Post-launch product work

| ID       | Feature                                                                            | Classification                                                                       |
| -------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| POST-001 | Sale/exchange/both intention and direct exchange negotiation                       | Product expansion after semantics and completion-state design                        |
| POST-002 | Automated exchange and wanted-title matching                                       | Post-launch                                                                          |
| POST-003 | Reader/custom/wanted shelves and social reading                                    | Post-launch                                                                          |
| POST-004 | Edition/ISBN/publisher intelligence and advanced multilingual bibliographic search | Post-launch                                                                          |
| POST-005 | Integrated payments, escrow, shipping, buyer protection, or delivery               | Separate regulated/product project, not current promise                              |
| POST-006 | Product analytics beyond privacy-minimized Web Vitals                              | Requires lawful basis, consent/retention, and provider decision                      |
| POST-007 | Paid listing promotion                                                             | Future monetization candidate; design, fairness, labeling, and legal review required |
| POST-008 | Professional seller plans                                                          | Future monetization candidate; no launch subscription or Pro tier exists             |
| POST-009 | Direct sponsorships                                                                | Future monetization candidate; no launch display-ad product exists                   |

No open repository-owned launch-critical engineering task is intentionally left in this queue.
