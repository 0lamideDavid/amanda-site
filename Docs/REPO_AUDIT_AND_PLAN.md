# Repository Audit and Implementation Plan

## Phase 0 — Audit findings

- The project folder contained only `Docs/` before this work. No `package.json`, no source code, no database setup, no existing authentication.
- No existing login/auth implementation was found to reuse or import.
- A static HTML mockup (`Amanda's _ Smart Cleaning, Swift Errand.html`) exists as a sibling file outside the project folder, not inside it. It is client-side only (inline CSS/JS, `mailto:`/WhatsApp form submission, nothing stored server-side). Per `README.md` and `PUBLIC_WEBSITE_SPEC.md`, it is explicitly not a design reference. It was read only to confirm the business content already implied by the specs: five services (hourly regular clean, hourly errands & concierge, flat-rate holiday-let turnover, "from" price deep clean, quote-only commercial), frequency options, and the booking fields (service, quantity, frequency, date, time, name, phone, email, postcode, notes). This matches `DATABASE_SCHEMA.md` and `BOOKING_SYSTEM_SPEC.md` and did not change any decision below.
- This folder was nested inside a git repository rooted at the home directory that is unrelated to this project (it showed pending changes to a different FastAPI app). It was not touched. This project now has its own git repository scoped to this folder, pushed to `github.com/toluwade/amanda`.
- Local PostgreSQL 16 is already running (via Homebrew) and reachable; no `amandas`-type database exists yet.

## What was established in this milestone

Express + TypeScript application skeleton, per `PROJECT_STRUCTURE.md`:

- `package.json` / `tsconfig.json` — Express, EJS, Prisma, Zod, `express-session` + `connect-pg-simple`, `bcryptjs`, `pg`.
- `src/config/env.ts` — environment variables validated with Zod at startup.
- `src/config/session.ts` — session middleware configured (Postgres-backed store, `httpOnly`/`sameSite`/production `secure` cookie flags), not yet wired to real login.
- `src/middleware/requireAdminAuth.ts` — route guard checking `req.session.adminUserId`, redirecting to login if absent.
- `src/routes/{public,auth,admin}.routes.ts`, matching controllers/views folders — placeholder handlers only, enough to prove routing and the auth guard work end to end.
- `src/app.ts` / `src/server.ts` — app bootstrap, `/health` check.
- `prisma/schema.prisma` — **draft** schema for `AdminUser`, `Service`, `Customer`, `Booking`, `Complaint` per `DATABASE_SCHEMA.md`. Not migrated yet.
- `.env.example`, `.gitignore`.

No public site design, no booking UI, and no real login logic were implemented, per the phase discipline in `IMPLEMENTATION_PHASES.md`.

## Open decisions needed before Phase 1 (authentication) proceeds

1. **Database** — use the local Postgres 16 instance for development (new `amandas_dev` database, owned by the local user)? Confirm, or provide different connection details for staging/production.
2. **Admin account provisioning** — proposed: a seed script reads `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env` and creates one `AdminUser` with a bcrypt hash if none exists. Confirm this is acceptable, or describe a different provisioning method.
3. **Session store** — proposed: Postgres-backed sessions via `connect-pg-simple` (no extra infra like Redis, reuses the existing database). Confirm.
4. **Password reset** — `AUTHENTICATION_SPEC.md` says this is optional for the first milestone. Proposed: skip it for now (admin can be reset manually via the seed script / database) and revisit if needed. Confirm.
5. **Prisma schema** — review `prisma/schema.prisma` above. Notable choices: `Decimal` for money/quantities, a `BookingStatus` enum (`PENDING`, `CONFIRMED`, `RESCHEDULE_REQUESTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), `priceSnapshot` stored directly on `Booking` so later price changes never rewrite historical totals. Confirm before migrations are generated.
6. **This project's own git repository** — done: initialized independently of the unrelated home-directory repo, pushed to `github.com/toluwade/amanda`.

## Phase 1 — Authentication (done)

All five open decisions above were confirmed: local Postgres, env-seeded admin, Postgres-backed sessions via `connect-pg-simple`, password reset deferred, and the draft Prisma schema approved and migrated (`prisma/migrations/20261105154521_init`) to both `amandas_dev` and `amandas_test`.

Implemented:
- `src/controllers/auth.controller.ts`, `src/services/auth.service.ts`, `src/repositories/adminUser.repository.ts`, `src/validators/auth.validator.ts` — real login/logout.
- Login verifies against `AdminUser.passwordHash` with `bcryptjs`; a fixed dummy hash is compared when the email doesn't exist, so a failed login takes the same time either way and the response never reveals whether the account exists.
- `req.session.regenerate()` on successful login (session fixation protection), `req.session.destroy()` + cookie clear on logout.
- `prisma/seed.ts` creates one `AdminUser` from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, skipping if one already exists (idempotent, verified by running it twice).
- `tests/auth.test.ts` — 5 passing integration tests against a real Postgres test database: unauthenticated redirect, unknown email, wrong password, and full login → admin access → logout → locked-out-again.
- Manually verified live against the dev server with curl: wrong password → 401, correct login → 302 to `/admin`, authenticated `/admin` → 200, logout → 302, post-logout `/admin` → redirected again.

`AUTHENTICATION_SPEC.md` verification checklist: all items checked except password reset, which was explicitly deferred (see decision 4 above).

## Phase 2 — Foundation and data model (done)

- `src/repositories/service.repository.ts` added, establishing the repository pattern for `Service` (`findActiveServices`, `findServiceById`) — no controller/UI on top of it yet, since Services management is Phase 5 and booking (which will consume it) is Phase 3.
- `prisma/seed.ts` extended to seed the five services implied by `DATABASE_SCHEMA.md` and already surfaced in the Phase 0 audit (regular cleaning, errands, holiday-let turnover, deep clean, commercial — pricing unit, base price, and minimum per service). Idempotent: verified by running `npm run db:seed` twice, second run skips all five.
- `tests/service.test.ts` added: confirms `findActiveServices` returns active services and excludes inactive ones. 6/6 tests passing (`npm test`), `tsc --noEmit` clean.
- No new migration was needed — the `Service` table and its columns already exist from the Phase 1 migration.

## Phase 3 — Booking workflow (done, backend only — no routes/UI, per phase discipline)

**Open business-rule gap, resolved with an explicit, documented assumption rather than silence:** `BOOKING_SYSTEM_SPEC.md` says conflict checking depends on staff assignment/working hours, which are undefined anywhere in the docs. Asked about this; the answer was "continue" without specifying staffing. Proceeded on the most conservative default — **single provider** (matches the business description, "one trusted local professional") — so any two `CONFIRMED`/`IN_PROGRESS` bookings with overlapping scheduled windows are flagged as a conflict, full stop, with no staff dimension. This is a safe-by-default assumption (it can only produce false-positive conflicts, never miss a real one) but it is an assumption, not a confirmed business rule — revisit if Amanda's ever has more than one person doing jobs, since the conflict check would then need a staff/resource dimension.

Also corrected while implementing: `Booking.priceSnapshot` was non-nullable in the original draft schema, but `"from"`/`"quote"` services have no price at request time. Made it nullable (migration `20261105160051_booking_price_nullable_index`, which also adds an index on `(status, scheduledStartAt, scheduledEndAt)` for the conflict-check query) — it gets set at request time when computable (hourly/flat), otherwise left null until an admin supplies a price on confirmation.

Implemented (`src/services/booking.service.ts`, `src/services/pricing.service.ts`, `src/services/customer.service.ts`, `src/repositories/{booking,customer}.repository.ts`, `src/validators/booking.validator.ts`):
- `createBookingRequest` — finds or creates the customer by phone (customers have no accounts), computes a price snapshot from the `Service` record (hourly: rate × max(quantity, minimum); flat: rate × quantity; from/quote: left `null`), creates the booking as `PENDING`.
- Status transitions enforced via an explicit allow-list (`PENDING`→`CONFIRMED`/`CANCELLED`, `CONFIRMED`→`RESCHEDULE_REQUESTED`/`IN_PROGRESS`/`CANCELLED`, `IN_PROGRESS`→`COMPLETED`/`CANCELLED`, terminal states fixed); invalid transitions throw `InvalidBookingTransitionError`.
- `confirmBooking` / `rescheduleBooking` both run the overlap conflict check before writing and throw `BookingConflictError` if the window collides with another confirmed/in-progress booking.
- `cancelBooking`, `startBooking`, `completeBooking` round out the actions from `ADMIN_DASHBOARD_SPEC.md`/`BOOKING_SYSTEM_SPEC.md`.
- `tests/booking.test.ts` — 8 new integration tests (pricing for hourly/quote services, the full confirm→start→complete chain, invalid transitions rejected, conflict detection, successful reschedule into a free slot, customer reuse by phone). **14/14 tests passing** overall, `tsc --noEmit` clean.

No HTTP routes or admin/public UI were added — reviewing requests, confirming, and rescheduling are still only reachable by calling the service functions directly (e.g. from Prisma Studio or a script), since routes/views are Phase 4 (admin) and Phase 6 (public).

## Phase 4 — Admin booking views and calendar (done)

First real admin UI (server-rendered EJS, no new frontend dependency). Scope note: the mockup exclusion in `README.md`/`PUBLIC_WEBSITE_SPEC.md` is specific to the *public* site, so this admin UI's layout/styling was my own call, kept plain and operational per `ADMIN_DASHBOARD_SPEC.md`'s "keep navigation clear and operationally focused."

- `src/controllers/overview.controller.ts` — `/admin` now shows real counts (pending requests, upcoming confirmed appointments) and a pending-requests table, replacing the Phase 1 placeholder.
- `src/controllers/booking.controller.ts` + `src/repositories/booking.repository.ts` additions (`listBookings`, `listBookingsScheduledBetween`, `listPendingRequests`, counts) — `/admin/bookings` (filterable by status/date) and `/admin/bookings/:id` (detail, with Confirm/Reschedule/Start/Complete/Cancel forms shown only for statuses where that action is valid, backed by the same transition guards from Phase 3). Errors (conflict, invalid transition) redirect back to the detail page with a message instead of a raw 500.
- `src/controllers/calendar.controller.ts` + `src/utils/{dateRange,calendarGrid}.ts` — month/week/day calendar views. **Pending requests are structurally excluded from ever appearing as scheduled events**: the calendar queries by `scheduledStartAt`, which is `null` until a booking is confirmed, so there's no way for a pending request to render as a calendar slot. The day view additionally lists same-day pending requests in a separate "Pending requests for this date" section, satisfying the spec's "if pending requests are shown, make their status unmistakable" without plotting them as events.
- Fixed a latent bug while touching this: `npm run build` compiled TypeScript but never copied `src/views`/`src/public` into `dist/`, so `npm start` would have served nothing. `build` now copies both.
- Tests: `tests/calendarGrid.test.ts` (pure grid-building logic) and `tests/admin-booking-routes.test.ts` (HTTP, authenticated: list/detail render, month calendar shows the confirmed booking but never the pending one, day view separates the two sections, confirming via the real endpoint updates status, and confirming into a conflicting slot redirects with an error rather than crashing). Caught and fixed a real cross-file test-isolation bug along the way — `tests/booking.test.ts`'s cleanup used a `name: { startsWith: "Test-only" }` filter that deleted `tests/service.test.ts`'s fixtures when both files ran concurrently; narrowed it to exact names. **22/22 tests passing**, `tsc --noEmit` clean, and manually smoke-tested every new route live against the dev server with curl (login → overview → bookings list → all three calendar views → stylesheet, all 200).

## Plan for the rest of the milestones (unchanged from `IMPLEMENTATION_PHASES.md`)

5. **Phase 5 — Admin management**: services/pricing, customers, complaints, overview.
6. **Phase 6 — Public one-page website**: real design, section navigation, booking modal wired to the backend.

Each phase stops at its review gate before the next begins, per `IMPLEMENTATION_PHASES.md`.
