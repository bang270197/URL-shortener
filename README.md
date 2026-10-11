# Shortly URL Shortener

A public, no-account URL shortener. You choose each code; anyone with the code can see privacy-preserving click analytics.

## Features

- Custom lowercase URL codes (`3-50` letters, numbers, and hyphens)
- HTTP 302 redirects
- Public total, monthly, device, and browser analytics
- Bot traffic excluded from click totals
- No IP address, raw User-Agent, referrer, location, or account data stored

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. In the Supabase **Connect** dialog, put the transaction-pooler PostgreSQL URI in `DATABASE_URL` and the direct PostgreSQL URI in `DIRECT_URL`.
4. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
5. Run `npm run db:migrate` to create the schema, then `npm run dev`.

Do not commit `.env.local`. It is ignored intentionally, and this application needs no Supabase API key or service-role key.

## Database commands

| Command | Purpose |
| --- | --- |
| `npm run db:generate` | Regenerate Prisma Client after schema changes. |
| `npm run db:migrate` | Create and apply a local development migration using `DIRECT_URL`. |
| `npm run db:deploy` | Apply committed migrations in a deployment environment using `DIRECT_URL`. |

The Next.js runtime uses the pooled `DATABASE_URL`; migration commands use `DIRECT_URL`. Never run migrations through the transaction pooler.

## Verification

```bash
npm test
npm run lint
npm run build
```

The browser journey is intentionally guarded to prevent it from writing to a production database. Point it only at a disposable test deployment/database:

```bash
$env:E2E_BASE_URL = "http://127.0.0.1:3000"
npx playwright test e2e/url-shortener.spec.ts
```

When `E2E_BASE_URL` is unset, the browser tests are skipped.

## Deployment and rollback

Set `DATABASE_URL`, `DIRECT_URL`, and `NEXT_PUBLIC_APP_URL` as protected deployment variables. Run `npm run db:deploy` before serving the new application version.

For an application rollback, deploy the previous application build. Do not roll database migrations back automatically: create a reviewed forward migration if a schema correction is required.
