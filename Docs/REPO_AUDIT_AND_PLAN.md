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

## Phase 5 — Admin management (done)

- **Services** (`/admin/services`, `/admin/services/new`, `/admin/services/:id/edit`) — create/edit name, description, pricing unit, base price, minimum, and an active toggle. Verified by test that changing a service's price **does not** alter an existing booking's `priceSnapshot` — the specific behavior `DATABASE_SCHEMA.md` calls out. Also note: the active checkbox is handled explicitly (`req.body.active === "on"`), not `z.coerce.boolean()`, because an unchecked HTML checkbox omits the field entirely rather than sending `false` — coercing a missing field would have silently defaulted every deactivation attempt back to `true`. Caught by a dedicated test before it could ship.
- **Customers** (`/admin/customers`, `/admin/customers/:id`) — list, and a detail page showing booking history and complaints alongside an edit form for contact details. No customer accounts, per `DATABASE_SCHEMA.md`.
- **Complaints** (`/admin/complaints`, `/admin/complaints/new`, `/admin/complaints/:id`) — log a complaint optionally linked to a customer/booking (with a "Log a complaint" shortcut added to the booking detail page), list/filter by status, and update status + admin notes. **Decision made here, not specified in the docs:** complaint status is a fixed four-value set (`open`/`investigating`/`resolved`/`closed`) stored as a plain string column, not a Prisma enum — easy to change without a migration if it turns out to be wrong.
- Overview page extended with an open-complaints count.
- `tests/admin-management-routes.test.ts` — 5 new tests. **27/27 tests passing** overall, `tsc --noEmit` clean, stable across repeated runs, and manually smoke-tested live (services/customers/complaints list and new-item pages, overview).

## Full verification pass across Phases 1–5 (2026-11-05)

Ran a complete check before starting Phase 6, at the user's request: clean `npm install` (0 vulnerabilities), `tsc --noEmit`, both databases dropped and rebuilt from migration history alone (`prisma migrate diff --exit-code` confirms zero drift between `schema.prisma` and the live dev DB), the seed script re-run and confirmed idempotent, the automated suite run 13+ times in a row, the actual `npm run build && npm start` production path exercised end-to-end for the first time (login → admin pages → logout all correct against compiled `dist/`), and every write path (booking confirm/start/complete, service edit, customer edit, complaint create/update) exercised live with curl against real data — including re-confirming live that editing a service's price does not change an already-created booking's `priceSnapshot`.

**Found and fixed a real bug:** one of those 13+ test runs failed with a transient 500 instead of 302. Root cause: `connect-pg-simple`'s table-creation SQL has no `IF NOT EXISTS` on `CREATE TABLE "session"`. `node --test` runs each test file as a separate process against the same test database; if two processes hit their first session write at nearly the same moment, both see the table missing and both try to create it — the loser gets an unhandled error. This was also a latent production risk (concurrent processes starting against a freshly-migrated database could race the same way). Fixed by moving table creation into a real migration (`20261105170000_session_table`, with proper `IF NOT EXISTS` guards) and setting `createTableIfMissing: false` in `src/config/session.ts`, so the table is guaranteed to exist before any app process starts — structurally eliminating the race rather than just getting lucky on reruns. Re-ran the suite 8 more times after the fix with zero failures.

Everything else checked out with no further issues.

## Phase 6 — Public one-page website (done)

The mockup exclusion was explicitly lifted by the user for this phase: they shared a published Framer template ("Claritas — Cleaning Service," a stock template, not a competitor's brand) and asked to use its visual style with Amanda's real content and the dark/light mechanism already present in the approved HTML mockup.

**How the design was read:** the Chrome extension wasn't connected and no other browser tool was available, so the live Framer page couldn't be inspected directly. The user instead dropped a full-page screenshot into a new `templates/` folder (gitignored — large reference images, not an app asset). Colors were extracted by pixel-sampling that screenshot directly with Pillow (a venv in the scratchpad dir, not a project dependency), not estimated by eye: cream background `#F5F3EC`, deep forest green `#163A2C`/`#12271C` (alternating sections, buttons, footer), lime accent `~#E6FFB4`, sage secondary text `#48755A`. Confirmed with the user before building.

**Built:**
- `src/public/css/site.css` — the palette above as CSS custom properties, light by default, dark via `[data-theme="dark"]` or `prefers-color-scheme`, same mechanism as the approved mockup. Claritas-style components adapted to Amanda's actual data shape (pill buttons/badges, eyebrow labels, alternating cream/dark-green sections, numbered step list, card grid) rather than copied verbatim — there's no "3-tier plan" layout since Amanda's five services don't map to that shape; they're a card grid plus a pricing table instead.
- `src/public/js/site.js` — dark/light toggle with `localStorage` persistence (plus a blocking inline script in `<head>` to avoid a flash of the wrong theme on load), the booking modal, and a live price estimate that mirrors `src/services/pricing.service.ts`'s rules client-side for instant feedback — the server always recomputes the authoritative price on submission, so this duplication is UX only, not a trust boundary.
- `src/controllers/public.controller.ts` — `GET /` renders real, active `Service` rows (via `findActiveServices`), not hardcoded content.
- `src/controllers/booking-request.controller.ts` + `POST /booking-requests` — the public write path. Validates with the existing `createBookingRequestSchema` and calls the existing `createBookingRequest` service (Phase 3) unchanged, so a public submission always lands as `PENDING`, never auto-confirmed, exactly like the admin-side booking flow already did.
- Content ported from the approved HTML mockup (copy, five services, pricing, booking form fields, "how it works" steps) — not the Framer template's generic corporate-cleaning copy.

**Found and fixed a real app-wide bug while wiring the new write endpoint:** none of the route handlers across any phase forwarded thrown errors to Express — there was no `asyncHandler`-style wrapper and no global error middleware. In Express 4, a rejected promise from an `async` route handler isn't caught automatically; left unhandled, it can hang the request and, since Node terminates on unhandled rejections by default, crash the whole server. Added `src/utils/asyncHandler.ts` and wrapped every route across `admin.routes.ts`, `auth.routes.ts`, and `public.routes.ts`, plus a global error-handling middleware in `app.ts`. `tests/asyncHandler.test.ts` proves the fix directly (a thrown error now reaches a clean 500, not a hang), and the full suite stayed green with this wrapping applied everywhere, confirming it didn't change any existing behavior.

**Verified:** `tsc --noEmit` clean, **35/35 tests passing** (stable across repeated runs), `npm run build && npm start` smoke-tested against the compiled public page/CSS/JS, and the live dev server exercised with curl end to end — including a real booking request through `POST /booking-requests` confirmed in Postgres as `PENDING` with the correct computed price and no `scheduledStartAt`, a validation-error path returning 400 with field errors, and an inactive-service submission correctly rejected with 400 instead of a crash.

**Not done, deliberately:** I could not visually verify the rendered page myself (no browser tool connected this session) — the CSS/markup were authored carefully against the sampled palette and checked structurally via curl, but an actual look in a real browser (light and dark) is worth doing before calling this final.

### Phase 6 redo — real Figma export, not a screenshot

The first pass (above) was wrong on two counts, per direct user feedback: it restructured the page into the *reference* design's section layout instead of keeping the original mockup's content/arrangement and only reskinning it, and it was built from pixel-sampling a screenshot rather than real design code. The user then provided a full Figma code export (`templates/index.html`, `global.css`, `global.js`, 146 images — gitignored, reference only) of a template called "Claritas," plus explicit written instructions: preserve the template's design system (typography, color, spacing, components), reuse its components wherever they map to something Amanda's site needs, build missing pieces (there was no booking modal) in the same visual language, and use judgment on which sections to keep/adapt/remove — adapting content from the approved HTML mockup, not forcing every template section in blindly.

**Exact values this time, not sampled:** `src/public/css/site.css` ports the real CSS verbatim from the export (`#f5f3eb`, `#163a2c`, `#12271c`, `#e1fcad`, etc., `Inter` font, the real component rules for buttons/cards/steps/pricing) rather than approximating from a screenshot. Confirmed these matched my earlier pixel-sampled estimates almost exactly, which was reassuring but not a substitute for having the real values.

**Section-by-section decisions**, confirmed with the user before building (two were asked directly; the rest follow the same "don't fabricate" principle they endorsed):
- **Kept, content swapped to Amanda's real copy:** Header, Hero, Who-we-are, How-it-works (trimmed from the template's 4 steps to Amanda's real 3: Request/Confirm/Relax), Services, Pricing, Why-choose-us.
- **Removed — not adaptable without fabricating something:** "Trusted by" (a marquee of named corporate clients — Amanda's has no corporate clients to name), "Industries we serve" (a B2B sector list that doesn't apply to a residential/errand service). The Industries section's dark two-column visual weight was reused for a new booking CTA band instead — that's style reuse, not a false claim.
- **Removed, not replaced:** the hero's fabricated corporate stats bar ("98% retention," "2.4M sq ft weekly," "500+ clients") and the pricing section's "Most popular" ribbon (there's no real basis for either claim on Amanda's services) — the hero stats were swapped for the mockup's real trust chips (Insured, DBS-checked, etc.) in the same visual slot; the pricing "popular" card still gets the dark visual treatment for rhythm, just with no text claim attached.
- **Testimonial — kept per explicit user choice**, but the quote/author/badge content is written to be unmistakably a placeholder ("This space is reserved for a genuine review... swap this out once the first one comes in," author name literally "Customer name"), not presented as a real review.
- **Photos — kept the template's actual stock images per explicit user choice**, copied into `src/public/images/` with alt text reading "Placeholder — swap for a real photo of Amanda's work" on every one.
- **Service pricing tags** (e.g. "2-hour minimum," "Supplies included") are pulled from the real notes already in the approved HTML mockup's pricing table, not invented.
- **Booking modal** — didn't exist in the template; built using the same tokens (border-radius, `rgba(18,39,28,0.2)` border convention taken directly from the template's own card borders, `Inter`, the existing `btn`/`btn-accent` button classes) so it reads as part of the same system rather than a bolted-on generic form.
- Added mobile nav toggle behavior (CSS + JS) since the template shipped the hamburger button markup but no working behavior for it (`global.js` was an empty stub).

**One thing worth your attention, not yet resolved:** the template's stock photos are now real app assets in `src/public/images/` (served at runtime, committed to git), not gitignored reference material like the original screenshot was. I don't know the Claritas template's license terms for redistributing its images outside the Figma file itself. Worth checking before this goes anywhere public — they're clearly marked as placeholders in the alt text, but that doesn't resolve a licensing question if one exists.

**Verified:** `tsc --noEmit` clean, all 35 tests still passing, `npm run build` confirmed to copy the new `images/`/`icons/` folders correctly, and every one of the 26 image/icon references on the live page checked individually with curl — all 200, no broken paths. Grepped the rendered output to confirm the fabricated content (client names, stats, invented experience-years badge) is actually gone, not just reworded. Still not visually reviewed in a real browser — same caveat as before.

## Plan for the rest of the milestones (unchanged from `IMPLEMENTATION_PHASES.md`)

Phases 1–6 are now all implemented. Remaining: your visual review of the live public page (light and dark), and any content/business-rule decisions from the open items noted above (single-provider conflict assumption from Phase 3, complaint status set from Phase 5).

Each phase stops at its review gate before the next begins, per `IMPLEMENTATION_PHASES.md`.
