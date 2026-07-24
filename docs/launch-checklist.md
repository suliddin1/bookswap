# Launch checklist

Everything below that can be solved in code is represented in the repository. The remaining items require ownership, credentials, or a business decision.

## Operator input required

- legal operator/person name and service address for Terms and Privacy notices;
- a monitored support/privacy contact channel;
- final production domain;
- decision on whether minors may transact and, if so, the exact age/guardian rule;
- decision on payment/delivery integration. Current product intentionally supports neither.

## Infrastructure ownership required

- create or restore a Supabase project;
- apply all migrations and run advisors;
- set Vercel production and preview environment variables;
- enable Auth email templates, redirect URLs, CAPTCHA, leaked-password protection and admin MFA;
- configure database backups and recovery retention;
- choose distributed rate limiting and error monitoring providers;
- choose the production log/metrics owner and retention, then set
  `WEB_VITALS_ENABLED=true` at build and runtime; verify structured
  `bookswap.web_vital` events contain only route group, metric, value, rating,
  and navigation type;
- rotate any secret that may have existed in the retired project.

## Release gate

- public catalog endpoint returns 200 against production data;
- signup, email confirmation, reset, upload, create listing, favorite, chat, sold, review, report and privacy request pass E2E;
- anonymous Data API cannot read email, phone, `is_admin`, `banned`, messages, favorites or notifications;
- normal users cannot update role/ban fields, open invalid chat rooms, review active listings or access admin endpoints;
- after representative production traffic, report mobile and desktop p75 LCP,
  CLS, and INP for home, catalog, listing detail, and seller storefront; require
  LCP <= 2.5 s, CLS <= 0.1, and INP <= 200 ms without substituting synthetic
  samples for field evidence;
- policy text is reviewed by Azerbaijani counsel after real operator details are inserted.
