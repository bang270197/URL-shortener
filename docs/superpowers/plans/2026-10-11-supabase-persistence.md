# Supabase Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist Shortly links and privacy-preserving click analytics in a user-owned Supabase PostgreSQL project through Prisma.

**Architecture:** Supabase supplies PostgreSQL only. Next.js accesses it through a cached Prisma client; `DATABASE_URL` is the Supavisor pooled runtime URL and `DIRECT_URL` is used only by migration/administrative Prisma commands. Link and analytics services replace the existing process-global `Map`.

**Tech Stack:** Next.js App Router, TypeScript, Prisma 6, Supabase PostgreSQL, Zod, UAParser.js, Vitest, React Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-11-supabase-persistence-design.md`

## Global Constraints

- Use the user's Supabase PostgreSQL project; do not add Supabase Auth, Storage, REST, Realtime, Edge Functions, API keys, or service-role keys.
- Runtime queries use `DATABASE_URL`; migrations use `DIRECT_URL`; connection strings are never logged or committed.
- Commit `.env.example` placeholders only. Keep `.env`, `.env.local`, and other secret-bearing environment files ignored.
- Validate absolute HTTP(S) destinations and lowercase codes matching `[a-z0-9-]{3,50}`; reject `api`, `stats`, and `favicon.ico`.
- Keep the product public and immutable: no account, owner, edit, delete, expiry, billing, team, QR code, or custom domain feature.
- Do not store IP addresses, raw User-Agent strings, referrers, locations, or user identifiers.
- A known link uses HTTP 302. Bot requests redirect without a click event; click write failure must not prevent the redirect.
- Public stats return 404 for an unknown code, never count their own visit, and aggregate months in UTC.

## Review Focus

- Prisma `P2002` from a concurrent duplicate create maps to HTTP 409 and preserves the original link (Tasks 2–3).
- `javascript:`, `ftp:`, and relative destinations are rejected before a database write (Task 2).
- `/My-Link` resolves `my-link` (Tasks 2 and 4).
- A click insert rejection still returns a 302 with the correct `Location` (Task 4).
- A valid zero-event link shows a useful stats zero-state (Task 5).

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `.env.example` | Safe variable placeholders. |
| `prisma/schema.prisma`, `prisma/migrations/*` | Models, indexes, and migrations. |
| `src/lib/db.ts` | Prisma client singleton. |
| `src/lib/validation.ts` | Code and destination validation. |
| `src/lib/links.ts` | Persistent link operations. |
| `src/lib/analytics.ts` | Click classification, storage, and aggregation. |
| `src/app/api/links/route.ts` | Database-backed link creation. |
| `src/app/[code]/route.ts` | Database-backed redirect. |
| `src/app/stats/[code]/page.tsx` | Database-backed public analytics. |
| `src/components/stats-chart.tsx`, `src/components/stats-breakdown.tsx` | Accessible analytics presentation. |
| `README.md` | Setup, migration, test, and deploy instructions. |

### Task 1: Provision Supabase and add Prisma configuration

**Files:** Create `.env.example`, `prisma/schema.prisma`, `src/lib/db.ts`, `prisma/schema.test.ts`; modify `.gitignore`, `package.json`, `README.md`.

**Interfaces:** Produces `prisma: PrismaClient`; models `ShortLink` and `ClickEvent`; enum `DeviceType`; ignored local `DATABASE_URL`, `DIRECT_URL`, and `NEXT_PUBLIC_APP_URL`.

- [ ] **Step 1: Create the Supabase project in the user's authenticated browser session**

Use a region appropriate to deployment. The user approves all organization/billing prompts. Retrieve the Supavisor transaction-pooler URI and the direct PostgreSQL URI through the Connect dialog without exposing either secret in source or chat.

- [ ] **Step 2: Write a failing schema test**

`prisma/schema.test.ts` asserts the schema defines a unique `ShortLink.code`, `ClickEvent` relation, and indexes for `[shortLinkId]`, `[clickedAt]`, and `[shortLinkId, clickedAt]`.

- [ ] **Step 3: Run the test to verify failure**

Run: `npm.cmd test -- prisma/schema.test.ts`
Expected: FAIL because the schema is absent.

- [ ] **Step 4: Implement configuration and schema**

Create ignored `.env.local` manually with the three variables; add only placeholders to `.env.example`. Define `ShortLink(id, code, destinationUrl, createdAt)` and `ClickEvent(id, shortLinkId, clickedAt, deviceType, browser)` with `cuid()` IDs, cascade relation, required indexes, `url = env("DATABASE_URL")`, and `directUrl = env("DIRECT_URL")`. Export a `globalThis`-cached Prisma singleton.

- [ ] **Step 5: Migrate and verify**

Run `npx prisma migrate dev --name init_shortly`, `npx prisma generate`, `npx prisma validate`, `npm.cmd test -- prisma/schema.test.ts`, and `git check-ignore .env.local`. Expected: migration files created, all checks pass, `.env.local` matches `.gitignore`.

- [ ] **Step 6: Commit**

Commit schema, migration, configuration template, tests, and Prisma singleton with message `feat: configure Supabase Prisma persistence`.

### Task 2: Add validation and persistent link services

**Files:** Create `src/lib/validation.ts`, `src/lib/validation.test.ts`, `src/lib/links.ts`, `src/lib/links.test.ts`.

**Interfaces:** Produces `normalizeCode(code: string): string`, `parseCreateLinkInput(input: unknown): { code: string; destinationUrl: string }`, `DuplicateCodeError`, `createShortLink(input): Promise<ShortLink>`, and `findShortLinkByCode(code: string): Promise<ShortLink | null>`.

- [ ] **Step 1: Write failing validation tests**

Assert `My-Link` becomes `my-link`; lengths 3 and 50 pass; invalid length, whitespace, underscore, and reserved codes fail. Assert `http:`/`https:` pass while `javascript:`, `ftp:`, and relative URLs fail.

- [ ] **Step 2: Run validation tests to verify failure**

Run: `npm.cmd test -- src/lib/validation.test.ts`
Expected: FAIL because the module is absent.

- [ ] **Step 3: Implement validation**

Use Zod or an equivalent focused parser. Return `new URL(destinationUrl).toString()` and a trimmed, lowercased code.

- [ ] **Step 4: Write failing persistent-service tests**

Mock Prisma `shortLink.create` and `findUnique`. Assert normalized values are sent, mixed-case lookup works, and a Prisma error `{ code: "P2002" }` becomes `DuplicateCodeError`.

- [ ] **Step 5: Implement services, verify, and commit**

Implement the listed interfaces through `prisma.shortLink`; rethrow unexpected errors. Run `npm.cmd test -- src/lib/validation.test.ts src/lib/links.test.ts`, expect PASS, then commit `feat: persist validated short links`.

### Task 3: Replace the create API's in-memory store

**Files:** Modify `src/app/api/links/route.ts`, `src/app/api/links/route.test.ts`, `src/components/create-link-form.tsx`; delete `src/lib/links-store.ts`, `src/lib/links-store.test.ts`.

**Interfaces:** Consumes Task 2 services. Produces `POST /api/links` with `{ code, destinationUrl, shortUrl }` and status 201, 400, 409, or 500.

- [ ] **Step 1: Rewrite route tests first**

Mock Task 2 services. Assert valid JSON returns 201 and a URL based on `NEXT_PUBLIC_APP_URL`; invalid JSON returns 400; `DuplicateCodeError` returns 409; unexpected database errors return a generic 500.

- [ ] **Step 2: Run the route tests to verify failure**

Run: `npm.cmd test -- src/app/api/links/route.test.ts`
Expected: FAIL because it imports `links-store`.

- [ ] **Step 3: Implement and remove old store**

Validate and create through Task 2 services. Use request origin only as a local-development fallback when `NEXT_PUBLIC_APP_URL` is absent. Retain form UI states. Delete only the old store after `rg "links-store" src` has no matches.

- [ ] **Step 4: Verify and commit**

Run: `npm.cmd test -- src/app/api/links/route.test.ts src/components/create-link-form.test.tsx`; expect PASS. Commit `feat: create links through Prisma`.

### Task 4: Persist eligible redirect clicks

**Files:** Create `src/lib/analytics.ts`, `src/lib/analytics.test.ts`; modify `src/app/[code]/route.ts`, `src/app/[code]/route.test.ts`.

**Interfaces:** Produces `classifyUserAgent(userAgent: string | null): { isBot: boolean; deviceType: DeviceType; browser: string }`, `recordClick(shortLinkId: string, userAgent: string | null): Promise<void>`, and a redirect route consuming `findShortLinkByCode`.

- [ ] **Step 1: Write failing classification tests**

Assert Chrome desktop, Safari iPhone, Firefox Android/tablet, Googlebot, and missing User-Agent produce stable labels; Googlebot must be excluded.

- [ ] **Step 2: Implement classification after RED**

Run `npm.cmd test -- src/lib/analytics.test.ts` and observe failure. Then use `ua-parser-js` after a focused bot regex. Persist only short-link ID, device type, and browser.

- [ ] **Step 3: Rewrite redirect tests first**

Assert mixed-case known code returns 302 and exact `Location`; unknown code is 404; bot traffic writes no event; human traffic writes once; and a rejected `recordClick` still returns 302.

- [ ] **Step 4: Implement redirect, verify, and commit**

Use link lookup; catch and generically log click-write errors before returning `NextResponse.redirect(destinationUrl, 302)`. Run `npm.cmd test -- src/lib/analytics.test.ts src/app/[code]/route.test.ts`, expect PASS, then commit `feat: record persistent redirect analytics`.

### Task 5: Query and render public analytics

**Files:** Modify `src/lib/analytics.ts`, `src/app/stats/[code]/page.tsx`, and page tests; create `src/lib/analytics-aggregation.test.ts`, `src/components/stats-chart.tsx`, `src/components/stats-chart.test.tsx`, `src/components/stats-breakdown.tsx`, `src/components/stats-breakdown.test.tsx`.

**Interfaces:** Produces `PublicLinkAnalytics` containing `code`, `totalClicks`, `monthlyClicks`, `devices`, and `browsers`; produces `getPublicLinkAnalytics(code: string, now?: Date): Promise<PublicLinkAnalytics | null>`.

- [ ] **Step 1: Write failing aggregate tests**

Mock Prisma events across non-contiguous UTC months. Assert total, first-event-to-current-month zero-fill, descending distributions with alphabetical ties, `null` unknown-code result, and an empty aggregate for a known zero-event link.

- [ ] **Step 2: Implement aggregates after RED**

Run `npm.cmd test -- src/lib/analytics-aggregation.test.ts` and observe failure. Implement grouped Prisma reads, UTC `YYYY-MM` keys, and zero-fill only when events exist.

- [ ] **Step 3: Write failing stats UI tests**

Assert code, total, chart summary, and semantic device/browser lists render; a zero-event link shows explicit zero state; unknown data invokes `notFound()`.

- [ ] **Step 4: Implement UI, verify, and commit**

Use the aggregate service from the server page. Create an accessible responsive Recharts bar chart with text summary and two semantic breakdown lists. Run `npm.cmd test -- src/lib/analytics-aggregation.test.ts src/app/stats/[code]/page.test.tsx src/components/stats-chart.test.tsx src/components/stats-breakdown.test.tsx`, expect PASS, then commit `feat: display persistent public analytics`.

### Task 6: Document and verify the database-backed workflow

**Files:** Create `e2e/url-shortener.spec.ts`, `README.md`; modify `.env.example`, `package.json`.

**Interfaces:** Produces scripts `db:generate`, `db:migrate`, and `db:deploy`, plus safe local/deployment instructions and a browser regression journey.

- [ ] **Step 1: Write a failing E2E journey**

Create a unique code, submit the form, visit its redirect, confirm a controlled HTTP(S) destination, then verify stats show one click; include unknown-code 404. Use a disposable test database/project or test-specific cleanup only; never clean production `DATABASE_URL`.

- [ ] **Step 2: Wire safe E2E setup and documentation**

Run `npx playwright test e2e/url-shortener.spec.ts` and observe failure until its test database strategy exists. Add scripts that do not print variables. Document Supabase Connect-dialog setup, migrations, test database safety, deployment variables, and rollback.

- [ ] **Step 3: Run full verification and commit**

Run `npx prisma validate && npm.cmd test && npm.cmd run lint && npm.cmd run build && npx playwright test e2e/url-shortener.spec.ts`. If lint lacks a configuration, add the smallest Next.js-compatible ESLint flat config in this task, then rerun. Commit `test: verify Supabase URL shortener workflow`.

## Plan Self-Review

- Tasks 1–2 cover configuration, secret safety, schema, Prisma, validation, and persistent links.
- Tasks 3–4 cover creation, redirect, bot exclusion, and best-effort writes.
- Task 5 covers totals, monthly zero-fill, device/browser breakdowns, zero states, and 404 behaviour.
- Task 6 covers documentation, safe E2E setup, and all quality gates.
- Every high-risk condition in Review Focus is explicitly assigned to a test-owning task, and later interfaces match the earlier signatures.
