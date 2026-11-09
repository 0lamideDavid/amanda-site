# Amanda's — Cleaning & Errand Service

Public one-page site (later milestone) + private admin system for Amanda's cleaning and errand service.

See [`Docs/`](./Docs) for the full specs, and [`Docs/REPO_AUDIT_AND_PLAN.md`](./Docs/REPO_AUDIT_AND_PLAN.md) for the repository audit and implementation plan.

## Stack

Node.js, Express, TypeScript, EJS, PostgreSQL, Prisma, Zod, session-based admin auth (`express-session` + `connect-pg-simple`).

## Local setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, SESSION_SECRET, SEED_ADMIN_EMAIL/PASSWORD
createdb amandas_dev   # or point DATABASE_URL at your own database
npx prisma migrate deploy
npm run db:seed        # creates one AdminUser from .env, skips if it already exists
npm run dev            # http://localhost:3000
```

Log in at `http://localhost:3000/admin/login` with the seeded credentials. `/admin` is protected by `requireAdminAuth` and redirects to `/admin/login` when unauthenticated; `/admin/logout` (POST) ends the session.

Optionally run `npm run db:demo` to populate the dev database with sample customers, bookings (across every status), and complaints, so the admin dashboard has something to look at beyond an empty state. Dev-only — re-runnable, clears and recreates its own records each time, never touches real data.

## Email notifications

Booking events send email via [Resend](https://resend.com): customers get "request received" / "confirmed" / "rescheduled" / "cancelled" / "completed" emails (skipped silently if they didn't give an email — it's optional on the booking form), and the admin gets a "new booking request" alert with a link straight into the dashboard.

Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env` to enable sending. Unconfigured, every send is a no-op (logged, never an error) — the app and all booking operations work fine without it, which is also what happens by default in dev/test. `ADMIN_NOTIFICATION_EMAIL` is optional and falls back to `SEED_ADMIN_EMAIL` if unset. `APP_BASE_URL` is used to build absolute links in emails (e.g. "Review in admin") — set it to the real deployed URL in production.

Templates live in `src/views/emails/` (one reusable EJS shell, table-based HTML for email-client compatibility) and reuse the same color palette as the public site. `src/services/email.service.ts` is the single place that renders and sends them; `src/services/booking.service.ts` calls it at each status-change trigger point.

## Tests

```bash
createdb amandas_test
DATABASE_URL=postgresql://<user>@localhost:5432/amandas_test npx prisma migrate deploy
npm test
```

Runs integration tests (`tests/auth.test.ts`) against a real Postgres database configured via `.env.test`: unauthenticated redirect, wrong email, wrong password, and a full login → access admin → logout → locked-out-again cycle.

## Current milestone

All six phases are implemented: authentication, the booking data model/workflow, admin bookings + calendar, admin management (services/pricing, customers, complaints), and the public one-page site with a working booking request flow. See `Docs/REPO_AUDIT_AND_PLAN.md` for decisions made along the way (single-provider conflict assumption, complaint status set, the Framer-template color palette used for the public site, and an app-wide async-error-handling fix found while building Phase 6). The live public page hasn't been visually reviewed in a real browser yet — see that doc's Phase 6 section.
