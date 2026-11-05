# Amanda's — Cleaning & Errand Service

Public one-page site (later milestone) + private admin system for Amanda's cleaning and errand service.

See [`Docs/`](./Docs) for the full specs, and [`Docs/REPO_AUDIT_AND_PLAN.md`](./Docs/REPO_AUDIT_AND_PLAN.md) for the repository audit and implementation plan.

## Stack

Node.js, Express, TypeScript, EJS, PostgreSQL, Prisma, Zod, session-based admin auth (`express-session` + `connect-pg-simple`).

## Local setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and SESSION_SECRET
createdb amandas_dev   # or point DATABASE_URL at your own database
npx prisma generate
npm run dev            # http://localhost:3000
```

`npm run dev` starts the app with `/health`, a placeholder public page, a placeholder admin login page, and an admin area protected by `requireAdminAuth` (redirects to `/admin/login` when not authenticated).

The Prisma schema in `prisma/schema.prisma` is currently a **draft** — see the open decisions in `Docs/REPO_AUDIT_AND_PLAN.md` before running `prisma migrate dev` against it.

## Current milestone

Foundation/scaffolding only. No real login, public site design, or booking UI yet — see `Docs/IMPLEMENTATION_PHASES.md` for the phase plan.
