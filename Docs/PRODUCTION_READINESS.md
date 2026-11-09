# Production readiness checklist

What's left before this site can go live for real customers. Verified against the current code, not guessed — each item below was confirmed by reading the relevant file. Organized by priority: launch-blocking, soon-after-launch, and nice-to-have.

## Launch-blocking

- **Real contact info.** `src/config/business.ts` (`BUSINESS_CONTACT`) still has a placeholder email (`hello@amandas.example`) and phone number (`+44 7000 000000`), shown in the site footer, the booking confirmation flow, and every outgoing email template.
- **A real testimonial.** The testimonials section (`src/views/public/index.ejs`) explicitly shows a "Placeholder — add a real review" badge, a dummy quote, and a generic avatar image. Needs at least one genuine customer review before launch.
- **Real photos.** The hero image, "who we are" image, and feature-section image are all still marked `alt="Placeholder — swap for a real photo of Amanda's work"` — they're stock photos standing in for actual photos of Amanda's work. (The 5 service-card images were fixed to match their services, but are still stock photography, not real photos of the business.)
- **A real `SESSION_SECRET`.** `.env` currently has `dev-only-local-test-secret-value`. Production needs a long random value, generated fresh and set directly in the hosting platform's environment variables — never committed to the repo.
- **Resend wired up for real.** `RESEND_API_KEY` and `EMAIL_FROM` are both unset, so every booking/admin-invite email is currently a silent no-op (logged, not sent). Needs a real Resend account, a verified sending domain, and the API key set in production.
- **A production database.** Nothing is provisioned yet — `amandas_dev` and `amandas_test` are both local. Needs a real Postgres instance, with migrations run against it (`prisma migrate deploy`).
- **`APP_BASE_URL` set to the real domain.** Currently defaults to `http://localhost:3000`. This is used to build absolute links in emails (e.g. "Review in admin") — left as localhost, every email link would be broken in production.
- **A deployment target.** No Dockerfile or platform config (e.g. `render.yaml`, `fly.toml`, `Procfile`) exists yet. Needs a decision on where this actually runs.
- **`app.set('trust proxy', ...)`.** Not configured in `src/app.ts`. Needed behind any reverse proxy or PaaS (Render, Railway, Fly, etc.) for two things that are currently silently wrong in that setup: secure cookies (the session config already checks `isProduction` to require HTTPS, but can't tell it's on HTTPS without this) and the booking-form rate limiter (which keys off the caller's IP — without `trust proxy`, every request looks like it's coming from the proxy, not the real client).
- **A privacy policy.** The booking form collects name, phone, email, and address, and there's currently no privacy policy or data-handling notice anywhere on the site. This is a UK business collecting personal data from UK customers — GDPR/UK DPA applies.

## Soon after launch

- **Favicon.** None exists — browser tabs currently show a generic icon.
- **Open Graph/Twitter meta tags, `robots.txt`, `sitemap.xml`.** None exist yet. The page currently only has a basic `<title>` and meta description.
- **An image logo.** The header currently shows the brand name as text (`.header-logo`), which reads fine, but the CSS already has a rule for `.header-logo img` ready to go if a real logo mark gets designed.
- **Accessibility pass.** Not yet done — no screen-reader or keyboard-navigation testing has happened.
- **Resolve the single-provider assumption.** The booking conflict-checking logic assumes one person/resource at a time. Worth confirming against how the business actually operates (solo vs. multiple cleaners) before it causes a real scheduling conflict.
- **Compress the remaining placeholder images.** `hero-main.png` (1.3MB) and `feature.png` (908KB) are uncompressed. Worth doing once they're replaced with real photos anyway, same treatment as the service-card images already got.

## Nice-to-have

- **Analytics.** Nothing set up yet (e.g. Plausible, GA).
- **Error monitoring.** Errors currently just go to `console.error` in the server logs (`src/app.ts`'s error handler) — no Sentry or equivalent, so a production error only surfaces if someone is watching the logs.
- **Database backup strategy.** Not yet decided — depends on which hosting/DB provider gets picked.
- ~~Invite another admin~~ — already built and shipped.

## Already solid (no action needed)

Worth noting these were checked and are already production-appropriate, so they're not blockers:
- Session cookies are already `httpOnly`, `sameSite: "lax"`, and conditionally `secure` based on `NODE_ENV` (`src/config/session.ts`).
- The booking-requests endpoint is rate-limited in production (`src/middleware/rateLimiter.ts`).
- Sessions persist in Postgres via `connect-pg-simple`, not in-memory, so they survive restarts.
