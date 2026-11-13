# Vercel Deployment Guide — Amanda's Site (fresh import)

Everything needed to deploy this repo to a **new Vercel project** and verify it works. Email is intentionally **not** set up yet — the app treats email settings as optional no-ops, so the site works without them.

---

## 1. Environment variables

Use the prepared import file: **`vercel-env-import.env`** (in the repo root, git-ignored, delete after importing).

**Vercel → Project → Settings → Environment Variables → Import (.env format)** — select that file.

| Variable | Value | Why |
|---|---|---|
| `DATABASE_URL` | Supabase **pooler** URL (in the file) | IPv4-reachable from Vercel. The direct `db.*.supabase.co:5432` URL is IPv6-only and crashes Vercel functions — never use it here. |
| `SESSION_SECRET` | 64-char random hex | Signs admin session cookies. |
| `APP_BASE_URL` | the deployed domain | Absolute links (emails). ⚠️ **Update after import if the new project's domain differs from `amanda-site-one.vercel.app`.** |
| `DEBUG_KEY` | 32-char hex (in the file) | Gates `/debug`, `/debug-home`, `/debug-services` in production: only `?key=<DEBUG_KEY>` opens them. Without it they return 404. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | generic test creds (in the file) | Only used by the seed script, not at runtime. |

**Email — skip for now:** `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL` stay unset (booking emails are skipped silently).

**Do NOT set:** `PORT` (Vercel manages it), `NODE_ENV` (Vercel sets `production`).

## 2. Project settings (fresh import)

| Setting | Value | Notes |
|---|---|---|
| Framework Preset | **Express** (auto-detected — leave as is) | The build runs in Vercel's backend-framework mode; `vercel.json` supplies the build command, function config and rewrites. **Do not change this to "Other"** — that mode requires a static output directory this project doesn't have and will fail with `STATIC_BUILD_NO_OUT_DIR`. |
| Node.js Version | 22.x — **automatic** | `package.json` now pins `"engines": { "node": "22.x" }`, so Vercel applies it on every build. No manual setting needed. |
| Root Directory | `./` (empty) | Default. |

## 3. Build behaviour (all handled by `vercel.json`)

- `buildCommand`: `npx prisma generate` — generates the Prisma client used by the function at runtime.
- The function entry is `api/index.ts` (exports the Express app); `src/**` is bundled via `includeFiles`.
- Static assets (`/css/*`, `/js/*`, `/images/*`, `/icons/*`) are served by `express.static` from the bundled `src/public` — they go through the function, not a CDN.

## 4. Deploy checklist (in order)

| # | Check | URL | Expected |
|---|---|---|---|
| 1 | Health | `/health` | `{"status":"ok"}` |
| 2 | Static asset via CDN | `/css/site.css` | 200, CSS text |
| 3 | DB query path | `/debug-services?key=<DEBUG_KEY>` | `{"ok":true,"count":5,...}` |
| 4 | Homepage | `/` | 200, five service cards |
| 5 | Login | `/admin/login` → `admin@example.com` / `Password123!` | Redirects into `/admin` |

**Diagnostic ladder if something fails:**
- Step 3 fails but `/health` works → the Prisma query itself is the problem (check `DATABASE_URL`).
- Step 3 passes but step 4 fails → the render path is the problem (needs runtime logs: `npx vercel logs --request-id <id>`).
- `/debug`, `/debug-home`, `/debug-services` all return 404 → `DEBUG_KEY` isn't set, or `?key=` doesn't match.

## 5. Database status (already done, for reference)

- ✅ Pooler connection string verified working (PostgreSQL 17.11 on Supabase, region eu-west-1)
- ✅ All migrations applied; tables exist: `AdminUser`, `Booking`, `Customer`, `Service`, `Complaint`, `session`, `_prisma_migrations`
- ✅ Seeded (generic test data):
  - Admin login: `admin@example.com` / `Password123!`
  - 5 services: Regular home cleaning £18/hr (2-hr min), Errands £20/hr (1-hr min), Holiday-let turnover £55 flat, End-of-tenancy from £180, Small commercial = quote

> 🔒 **Before real launch:** create a real admin from the Team page and delete the test admin; change the seed credentials; rotate the Supabase DB password (it appears in the import file and this doc). See `Docs/PRODUCTION_READINESS.md` for the full pre-launch checklist (real contact info, photos, testimonial, email setup, privacy policy).

## 6. Local verification commands (Mac)

```bash
# typecheck + compile
npm run build

# run locally against the live DB (pooler URL)
DATABASE_URL="<pooler URL>" PORT=3999 npx tsx src/server.ts
curl -s http://localhost:3999/health
curl -s http://localhost:3999/debug-services   # open in dev without DEBUG_KEY
```
