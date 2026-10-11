# Supabase persistence for Shortly

**Status:** Approved design; awaiting implementation-plan review  
**Date:** 2026-10-11  
**Scope:** Replace the in-memory URL-shortener store with persistent Supabase PostgreSQL storage.

## 1. Purpose and success criteria

Short links and click counts currently live in a process-global `Map`. They disappear whenever the Next.js server restarts and cannot be shared by multiple deployed instances.

This change persists links and privacy-preserving click events in a Supabase PostgreSQL project through Prisma. It succeeds when:

- links, click totals, and analytics survive an application restart;
- creating a duplicate custom code returns a conflict without overwriting the original link;
- a known short URL redirects with HTTP 302 even if analytics-event storage fails;
- public analytics show totals, monthly activity, device distribution, and browser distribution from stored events;
- database credentials stay in ignored environment files and are never logged or committed.

## 2. Scope

### Included

- One user-owned Supabase PostgreSQL project.
- Prisma schema, generated client, migrations, and a reusable Prisma singleton.
- Connection configuration for Supavisor pooled runtime traffic and direct migration traffic.
- Persistent create, redirect, click-capture, and public-analytics queries.
- User-Agent classification into normalized device and browser labels; bot exclusion.
- Database-aware tests and setup documentation.

### Excluded

- Supabase Auth, Storage, Realtime, REST API usage, Edge Functions, and service-role keys.
- Accounts, link ownership, editing, deletion, expiration, billing, teams, QR codes, and custom domains.
- IP addresses, precise location, referrer, raw User-Agent persistence, and bot click counting.

## 3. Supabase and environment configuration

The user creates or selects a Supabase project through their own authenticated browser session. The application uses only PostgreSQL connection strings from Supabase's Connect dialog.

| Variable | Use | Storage |
| --- | --- | --- |
| `DATABASE_URL` | Supavisor transaction-pooler connection used by the deployed Next.js application | `.env.local` and deployment secrets |
| `DIRECT_URL` | Direct database connection used by Prisma migrations and local administrative commands | `.env.local` and deployment migration environment |
| `NEXT_PUBLIC_APP_URL` | Canonical public base URL used when returning a newly created short URL | `.env.local` and deployment environment |

`.env.local`, `.env`, and all other local environment files remain ignored. `.env.example` contains only placeholder values and explanatory comments. No Supabase API key is needed.

The runtime URL uses the Supavisor pooler because a serverless deployment can create many short-lived connections. Prisma CLI migration commands use the direct URL, avoiding transaction-pooler session limitations.

## 4. Data model

```prisma
model ShortLink {
  id             String       @id @default(cuid())
  code           String       @unique
  destinationUrl String
  createdAt      DateTime     @default(now())
  clickEvents    ClickEvent[]
}

model ClickEvent {
  id          String    @id @default(cuid())
  shortLinkId String
  clickedAt   DateTime  @default(now())
  deviceType  DeviceType
  browser     String
  shortLink   ShortLink @relation(fields: [shortLinkId], references: [id], onDelete: Cascade)

  @@index([shortLinkId])
  @@index([clickedAt])
  @@index([shortLinkId, clickedAt])
}

enum DeviceType {
  desktop
  mobile
  tablet
  other
}
```

`ShortLink.code` is normalized to lowercase before storage and remains globally unique. `ClickEvent` stores only the fields needed for the public aggregates. It does not contain an IP address, referrer, raw User-Agent, location, or user identifier.

## 5. Application architecture

| Component | Responsibility |
| --- | --- |
| `prisma/schema.prisma` | PostgreSQL models, enum, indexes, and migration source. |
| `src/lib/db.ts` | PrismaClient singleton that avoids duplicate clients during development hot reload. |
| `src/lib/validation.ts` | Shared destination URL, custom-code normalization, reserved-code, and input validation. |
| `src/lib/links.ts` | Create and look up links; translates Prisma unique-constraint errors to domain errors. |
| `src/lib/analytics.ts` | Bot detection, User-Agent classification, click insert, and public aggregate query. |
| `src/app/api/links/route.ts` | Maps validated create requests and domain errors to JSON responses. |
| `src/app/[code]/route.ts` | Finds a link, records an eligible click best-effort, and returns a 302 redirect. |
| `src/app/stats/[code]/page.tsx` | Renders database-backed total, monthly, device, and browser analytics. |

The existing `src/lib/links-store.ts` in-memory store is removed after all consumers use the database services.

## 6. Behaviour and error handling

### Create

The create route accepts a JSON object containing `destinationUrl` and `code`. It accepts only absolute `http:` or `https:` destinations. Codes are trimmed, lowercased, constrained to `[a-z0-9-]{3,50}`, and reject reserved route namespaces such as `api`, `stats`, and `favicon.ico`.

An existing code, including a concurrent unique-index race, returns HTTP 409 with a safe error message. Invalid input returns HTTP 400. Unexpected database failures return HTTP 500 without database details.

### Redirect and click capture

The redirect route looks up the normalized code. Unknown codes return 404. Known codes return HTTP 302 to the stored destination.

Before returning the redirect, a recognized non-bot request is classified and persisted as one `ClickEvent`. If this insert fails, the error is logged server-side without sensitive values and the redirect still succeeds. Recognized bot/crawler traffic redirects but does not create an event.

### Public analytics

The stats page is public. It returns 404 for an unknown code and a zero-state for a known code without events.

For known codes it displays:

- total recorded events;
- a UTC monthly series from the first event month through the current month, including zero-count months;
- device counts for desktop, mobile, tablet, and other;
- browser counts using normalized labels such as Chrome, Safari, Firefox, Edge, and Other.

Viewing analytics never creates a click event.

## 7. Migration and deployment flow

1. Create a Supabase project and obtain its pooled and direct PostgreSQL connection strings without copying them into source control.
2. Add the strings locally to `.env.local` and add placeholders to `.env.example`.
3. Run `prisma migrate dev --name init_shortly` locally using `DIRECT_URL`; commit the generated migration files.
4. Verify schema and application behaviour against a disposable development/test database.
5. Add the same values as protected deployment environment variables.
6. Run `prisma migrate deploy` with `DIRECT_URL` as part of the production release process, then deploy the Next.js application using `DATABASE_URL`.

The direct and pooled URLs are intentionally separate. A migration must never be run through the transaction pooler.

## 8. Testing and acceptance criteria

Tests cover:

- code normalization, URL protocol validation, and reserved-code rejection;
- persistent creation, case-insensitive lookup, and duplicate-code mapping including Prisma `P2002`;
- successful redirect, unknown redirect, bot exclusion, and redirect survival after click-insert failure;
- representative desktop/mobile/tablet/browser User-Agent classification;
- total, monthly zero-fill, and deterministic device/browser aggregate results;
- a valid link's zero-state and an unknown analytics page's 404;
- secret-safe `.gitignore` coverage and migration/schema validation.

Before completion, the project runs Prisma validation, relevant tests, the full test suite, lint when a project ESLint configuration exists, and a production build. The complete browser journey creates a link, opens the redirect, and confirms the database-backed analytics count.

## 9. Operational decisions

- The user controls the Supabase account, project region, and any billing action.
- The app does not need a Supabase API key or service-role key.
- Connection strings are only entered through local ignored files and deployment-secret UIs; they are not pasted into chat, source, test snapshots, or commit messages.
- Database writes are authoritative; there is no migration path for the current in-memory data because it is ephemeral development-only state.
