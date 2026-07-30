# Launch-readiness issue queue

Updated: 30 July 2026

This queue contains only unresolved work. Completed repository work is summarized in `PROJECT_STATE.md` and evidenced in `QA_EVIDENCE.md`.

## Friends-only private-beta promotion blocker

| ID     | Owner action                                                                                                                     | Evidence and boundary                                                                                                                                                                                                                                                                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PB-001 | Make the reviewed current application and intended production schema compatible without crossing the no-risky-migration boundary | Production has the legacy baseline while current `main` directly calls migration 14/18/21-era contracts. The ordered remainder includes migration 21's generated search column/index rebuild, which the runbook classifies as lock/rewrite-sensitive. Current code must not be deployed and the sequence must not be applied under this iteration's safety rules. |

## Owner-accepted private-beta deferrals

| ID          | Deferred item                                                         | Required boundary                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PB-RISK-001 | Encrypted database/Auth/Storage backup and isolated restore rehearsal | Not a friends-beta blocker by explicit owner decision; mandatory before broad public launch, destructive/materially risky production migration, or meaningful real-user data accumulation |
| PB-RISK-002 | Final legal operator/contact/age/retention facts and counsel approval | Friends beta must be visibly labeled, invitation-only, and warn testers not to enter sensitive personal or payment data; placeholders remain a public-launch blocker                      |

## Public-launch external blockers

| ID      | Owner                                   | Blocker                                                                    | Repository preparation                                                                                                                                                                | Completion evidence                                                                                      |
| ------- | --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| EXT-002 | Product/legal owner + qualified counsel | Legal operator/contact/jurisdiction/age/retention/appeal facts are unknown | Azerbaijani Terms, Privacy, Marketplace Rules, Safety, prohibited-content, reporting, appeals, transaction responsibility, and deletion drafts complete with centralized placeholders | All placeholders replaced, counsel approval/date/version recorded, routes visually/accessibly reverified |

## Production/deployment-only blockers

| ID       | Owner action                                                                                                                                                                                                | Why repository code cannot close it                                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PROD-001 | On a verified isolated restore, reconcile the privately verified legacy history with the canonical baseline and rehearse only the remaining ordered migrations; only then approve production reconciliation | Fingerprints/classification/runbook are prepared, but no restore, history repair, dry run, migration application, or post-migration verification has run            |
| PROD-002 | Verify hosted Site URL/redirects, confirmation, 12-character password policy, secure changes, limits, leaked-password decision, and enforced admin MFA                                                      | Only the disabled leaked-password warning is observed; remaining dashboard settings are unverified                                                                  |
| PROD-003 | Create/checksum an encrypted off-project database backup with managed Auth coverage and a separate Storage inventory/copy; restore it in isolation and measure RPO/RTO                                      | Tooling and an empty encrypted destination now exist, but the owner deferred all backup/auth/password work; no archive or recovery proof exists                     |
| PROD-004 | Complete Vercel Production configuration and set the canonical origin/domain without exposing values                                                                                                        | Supabase variable names/scopes and production-vs-development URL separation pass; `NEXT_PUBLIC_SITE_URL` and beta flag are absent, and no custom domain is verified |
| PROD-006 | Name log retention, uptime/alert destinations, incident owners, and on-call test; then run post-deploy smoke, authorization, accessibility, and performance checks                                          | Seven-day Vercel runtime query is clean but proves neither alerting nor launch behavior                                                                             |

## Strong pre-launch recommendations

| ID      | Recommendation                                                                                                     | Status                                                                                                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRE-001 | Run `supabase db reset` and both SQL test scripts on a Docker-capable workstation                                  | PASS on 30 July: 22 migrations plus seed, launch SQL, representative query-plan SQL, schema lint, fixture cleanup, and local-stack teardown                                                                     |
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
