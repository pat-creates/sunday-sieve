# Sunday Sieve — egg tart pre-orders

Pre-order site for Sunday Sieve's weekend egg tart batches: pickup only, guest checkout,
payment by QR transfer with manual verification. Built from the technical design document
(`egg-tart-preorder-tdd(final final).md`) and styled with the Sunday Sieve design system.

## Stack

Next.js (App Router) + TypeScript, Drizzle, Postgres (Supabase in production), Supabase Storage,
Resend for email.

## Local setup

No Docker needed. Without `DATABASE_URL`, the app uses PGlite (Postgres in WASM) in `.pglite/`,
so the order-status trigger, row locks and RLS behave as they will in production.

```bash
npm install
npm run db:seed   # applies db/migrations and seeds products, payment channels, pickup point
npm run dev
```

PGlite is single-process: stop `npm run dev` before running `db:*` scripts.
Without `RESEND_API_KEY`, emails are printed to the terminal and saved in `.dev-mail/`.
Without Supabase keys, uploaded files go to `.storage/`.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase transaction-pooler URL (Singapore). Unset = local PGlite |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Private storage. Server-only: never prefix with `NEXT_PUBLIC_` |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` | Transactional email |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_MESSENGER_URL`, `NEXT_PUBLIC_CONTACT_NUMBER` | Public site facts |

## Layout

- `db/migrations/` — hand-written SQL, the source of truth: schema, the order-transition trigger (TDD §6.3), RLS
- `db/seed.sql` — launch menu, payment channels, pickup point
- `src/lib/db/` — Drizzle schema and client
- `src/lib/domain.ts` — deadlines, capacity, order numbers, tokens
- `src/lib/notifications/` — email outbox, templates, transport
- `src/styles/` — design system tokens and component styles
