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

## Plan for the rest of the milestones (unchanged from `IMPLEMENTATION_PHASES.md`)

2. **Phase 2 — Foundation and data model**: the schema is already migrated as part of Phase 1 above; remaining work is seeding any other minimal dev data (e.g. sample `Service` rows) once needed.
3. **Phase 3 — Booking workflow**: booking persistence, status transitions, scheduling vs. requested-time separation, conflict checks.
4. **Phase 4 — Admin booking views and calendar**: list/detail, month/week/day views, pending vs. confirmed distinction.
5. **Phase 5 — Admin management**: services/pricing, customers, complaints, overview.
6. **Phase 6 — Public one-page website**: real design, section navigation, booking modal wired to the backend.

Each phase stops at its review gate before the next begins, per `IMPLEMENTATION_PHASES.md`.
