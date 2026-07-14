# Decision requests

Only genuine product, legal, operational, credential, and deployment decisions belong here. Engineering defects already evidenced in ISSUE_QUEUE.md do not need user re-approval to fix in Goal mode when the selected slice is authorized.

## DR-001 — Development service secret handoff

Status: External blocker for full authenticated E2E.

The connected Supabase tools expose the development project and publishable keys but not a service-role/secret key. The current Next.js server mutation architecture requires SUPABASE_SERVICE_ROLE_KEY.

Decision/action required: the repository owner should configure the bookswap-development server secret in local .env.local or the approved secret manager, never in chat, Git, browser variables, screenshots, logs, or documentation. Confirm which environment Goal mode may use. Once available, run the P0-005 authorization matrix.

This does not block documentation or public-schema work; it blocks credible verification of protected route handlers and therefore launch readiness.

## DR-002 — Legal operator and support identity

Status: Required before launch.

Provide the legal operator name/entity, jurisdiction/address disclosure requirements, privacy/support email, moderation/report contact, data-controller wording, effective dates, and escalation/appeal contact. Current legal pages cannot be declared complete without facts.

## DR-003 — Age/minor policy

Status: Required before launch.

Decide minimum age, parental/guardian requirements, handling of children's data, prohibited contact behavior, and safety escalation. Parents exchanging children's books are an audience, but that does not decide whether minors may hold accounts.

## DR-004 — Transaction and handoff policy

Status: Required for Azerbaijani trust copy.

Confirm allowed payment arrangements, local meeting guidance, optional user-arranged delivery language, prohibited goods/content, no-guarantee wording, dispute boundaries, and whether precise contact details may be exchanged only after both users opt in.

## DR-005 — Exchange negotiation semantics

Status: Required before exchange schema/API design is finalized.

Decide whether exchange supports only one-for-one books, multi-book bundles, and/or book-plus-cash balancing; whether a suggested match can be reserved; and which completion states drive reviews. Recommended first release: suggestions plus direct negotiation, no reservation guarantee, optional multi-book discussion in chat, no platform-handled cash.

## DR-006 — Shelf privacy defaults

Status: Required before shelves/wanted implementation.

Decide visibility defaults for owned, read, custom, and wanted shelves. Recommended: wanted titles and custom shelves private by default with explicit per-shelf publication; only data needed for a match is disclosed as a match suggestion.

## DR-007 — Production environment and domain

Status: Required before deployment.

Name the hosting account/project, production domain, authorized Supabase production organization/region, environment ownership, data residency expectations, backup/restore target, and approval path. Creating bookswap-development did not authorize production provisioning or deployment.

## DR-008 — Abuse controls and observability providers

Status: Required before launch.

Choose approved durable rate limiting, error tracking, logs/retention, uptime monitoring, alert destination, moderation provider, and incident owner. The current in-memory limiter and optional moderation integration are not production evidence.

## DR-009 — Product analytics and privacy

Status: Required only if analytics are desired.

Choose whether to collect product analytics, lawful basis/consent model, permitted events, retention, IP/device handling, and provider. Default without a decision: no non-essential tracking.

## DR-010 — Leaked-password protection and Auth plan

Status: Required before production launch if password authentication remains enabled.

The Supabase security advisor reports leaked-password protection disabled. Current official documentation says this control is available on Pro and above, while bookswap-development was explicitly authorized only at zero cost.

Decision/action required: authorize a production plan that includes leaked-password protection, or approve a documented passwordless/compensating-control strategy during the production Auth design. Goal mode must not upgrade a plan or incur cost autonomously.

## Resolved during preparation

- A separate development Supabase project was allowed only with authenticated access and no paid commitment. The authorized organization was on the free plan, the reported cost was zero monthly, and bookswap-development was created in eu-central-1.
- The inactive legacy bookswap Supabase project was not restored or modified.
- Integrated payment and platform-controlled shipping are outside current scope.
- Existing BookSwap visual identity is preserved; references are behavioral, not redesign targets.
