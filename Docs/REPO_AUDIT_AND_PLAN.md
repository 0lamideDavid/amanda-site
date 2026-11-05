# Repository Audit and Implementation Plan

## Phase 0 — Audit findings

- The project folder contained only `Docs/` before this work. No `package.json`, no source code, no database setup, no existing authentication.
- No existing login/auth implementation was found to reuse or import.
- A static HTML mockup (`Amanda's _ Smart Cleaning, Swift Errand.html`) exists as a sibling file outside the project folder, not inside it. It is client-side only (inline CSS/JS, `mailto:`/WhatsApp form submission, nothing stored server-side). Per `README.md` and `PUBLIC_WEBSITE_SPEC.md`, it is explicitly not a design reference. It was read only to confirm the business content already implied by the specs: five services (hourly regular clean, hourly errands & concierge, flat-rate holiday-let turnover, "from" price deep clean, quote-only commercial), frequency options, and the booking fields (service, quantity, frequency, date, time, name, phone, email, postcode, notes). This matches `DATABASE_SCHEMA.md` and `BOOKING_SYSTEM_SPEC.md` and did not change any decision below.
- This folder is nested inside a git repository rooted at the home directory that is unrelated to this project (it currently shows pending changes to a different FastAPI app). It has not been touched. This project should get its own git repository, scoped to this folder, once confirmed.
- Local PostgreSQL 16 is already running (via Homebrew) and reachable; no `amandas`-type database exists yet.

## What was established in this milestone

Express + TypeScript application skeleton, per `PROJECT_STRUCTURE.md`:

- `package.json` / `tsconfig.json` — Express, EJS, Prisma, Zod, `express-session` + `connect-pg-simple`, `bcrypt`, `pg`.
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
6. **This project's own git repository** — confirm it's fine to `git init` this folder independently (it currently sits inside an unrelated home-directory repo).

## Plan for the rest of the milestones (unchanged from `IMPLEMENTATION_PHASES.md`)

1. **Phase 1 — Authentication** (next, pending the decisions above): real login/logout handlers, bcrypt password verification, session regeneration on login, validation with Zod, auth error handling, manual verification checklist.
2. **Phase 2 — Foundation and data model**: approve and run the Prisma migration, seed minimal dev data.
3. **Phase 3 — Booking workflow**: booking persistence, status transitions, scheduling vs. requested-time separation, conflict checks.
4. **Phase 4 — Admin booking views and calendar**: list/detail, month/week/day views, pending vs. confirmed distinction.
5. **Phase 5 — Admin management**: services/pricing, customers, complaints, overview.
6. **Phase 6 — Public one-page website**: real design, section navigation, booking modal wired to the backend.

Each phase stops at its review gate before the next begins, per `IMPLEMENTATION_PHASES.md`.
