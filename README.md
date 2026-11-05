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

## Tests

```bash
createdb amandas_test
DATABASE_URL=postgresql://<user>@localhost:5432/amandas_test npx prisma migrate deploy
npm test
```

Runs integration tests (`tests/auth.test.ts`) against a real Postgres database configured via `.env.test`: unauthenticated redirect, wrong email, wrong password, and a full login → access admin → logout → locked-out-again cycle.

## Current milestone

Phases 1–3 are implemented: admin login/logout with Postgres-backed sessions, a seeded `Service` table, and the booking workflow (request → confirm/reschedule/cancel/start/complete) with price snapshotting and conflict detection — all at the service-layer, with no HTTP routes or UI yet. See `Docs/REPO_AUDIT_AND_PLAN.md` for what was decided along the way (notably: conflict checking currently assumes a single provider, since staffing isn't defined in the docs). No admin dashboard or public site design yet — see `Docs/IMPLEMENTATION_PHASES.md` for the phase plan.
