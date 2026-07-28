# Launch-readiness issue queue

Updated: 28 July 2026

This queue contains only unresolved work. Completed repository work is summarized in `PROJECT_STATE.md` and evidenced in `QA_EVIDENCE.md`.

## True launch blockers

| ID      | Owner                                   | Blocker                                                                    | Repository preparation                                                                                                                                                                | Completion evidence                                                                                      |
| ------- | --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| EXT-002 | Product/legal owner + qualified counsel | Legal operator/contact/jurisdiction/age/retention/appeal facts are unknown | Azerbaijani Terms, Privacy, Marketplace Rules, Safety, prohibited-content, reporting, appeals, transaction responsibility, and deletion drafts complete with centralized placeholders | All placeholders replaced, counsel approval/date/version recorded, routes visually/accessibly reverified |

## Production/deployment-only blockers

| ID       | Owner action                                                                                                                          | Why repository code cannot close it                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| PROD-001 | Provision/identify production Supabase/Vercel, domain, redirects, region, env ownership, and deploy                                   | Production infrastructure operations are excluded                                        |
| PROD-002 | Verify Auth confirmation, password policy, secure password changes, platform limits, leaked-password decision, and enforced admin MFA | Hosted dashboard/plan facts are external; paid changes are unauthorized                  |
| PROD-003 | Verify backup/PITR retention, encrypted export, isolated restore, Storage recovery, and recovery objectives                           | Procedures are prepared; real production recovery evidence requires owner infrastructure |
| PROD-004 | Choose log/error destination, retention, alert queries/destinations, incident owners, and on-call test                                | Code emits safe structured events but cannot create operational ownership                |
| PROD-005 | Supply optional moderation/email/CAPTCHA provider decisions and credentials                                                           | No key may be invented or committed; CAPTCHA is intentionally not claimed enabled        |
| PROD-006 | Run post-deploy production smoke, authorization, accessibility, and field performance checks                                          | Deployment and real production verification are excluded                                 |

## Strong pre-launch recommendations

| ID      | Recommendation                                                                                                     | Status                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| PRE-001 | Run `supabase db reset` and both SQL test scripts on a Docker-capable workstation                                  | Prepared; local tool unavailable here                                                                     |
| PRE-002 | Run an approved external dependency advisory query (`npm audit` or equivalent) and triage current advisories       | Patched installed-tree baseline passes; standalone networked audit was not authorized by this environment |
| PRE-003 | Conduct manual Azerbaijani editorial review with native marketplace/legal context                                  | Engineering localization pass complete                                                                    |
| PRE-004 | Exercise backup restore, failed migration, credential leak, accidental moderation, and account compromise tabletop | Runbooks prepared; owner exercise pending                                                                 |

## Post-launch product work

| ID       | Feature                                                                            | Classification                                                  |
| -------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| POST-001 | Sale/exchange/both intention and direct exchange negotiation                       | Product expansion after semantics and completion-state design   |
| POST-002 | Automated exchange and wanted-title matching                                       | Post-launch                                                     |
| POST-003 | Reader/custom/wanted shelves and social reading                                    | Post-launch                                                     |
| POST-004 | Edition/ISBN/publisher intelligence and advanced multilingual bibliographic search | Post-launch                                                     |
| POST-005 | Integrated payments, escrow, shipping, buyer protection, or delivery               | Separate regulated/product project, not current promise         |
| POST-006 | Product analytics beyond privacy-minimized Web Vitals                              | Requires lawful basis, consent/retention, and provider decision |

No open repository-owned launch-critical engineering task is intentionally left in this queue.
