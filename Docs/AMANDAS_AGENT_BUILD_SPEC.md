# Amanda's — Agent Build Specification

## 1. Project goal

Build a web application for Amanda's cleaning and errand service. The application will include a public one-page website and a private admin system for managing service requests and day-to-day operations.

The immediate goal is **authentication and the foundational application structure**. Public website design and booking interfaces come later.

## 2. Important implementation order

1. Audit the existing repository and identify existing code, dependencies, authentication, database setup, and scripts.
2. Report findings and propose the smallest safe implementation plan.
3. Implement or integrate authentication only after checking whether reusable authentication already exists.
4. Establish the application structure and database foundation needed for later modules.
5. Implement booking data/workflows and the admin calendar after the foundation is reviewed.
6. Build the public one-page website and booking modal only in a later approved milestone.

Do not start by redesigning the public website.

## 3. Suggested technology direction

Use the existing repository's established stack if it is suitable. If the repository is not already configured, the intended direction is:

- Node.js
- Express.js
- TypeScript
- EJS or another simple server-rendered template approach
- PostgreSQL
- Prisma ORM
- Zod for validation
- Session-based authentication for the admin area

Do not replace an existing working stack without explaining why and obtaining approval.

## 4. Application shape

The application is expected to contain:

- A public website presented as one page with section navigation.
- A booking request modal/popup opened from booking calls to action.
- A protected admin area.
- Admin management for booking requests, services, pricing, customers, and complaints.
- A calendar view for scheduled services.

The public website and admin area can have different layouts while sharing the same Express application and database.

## 5. Booking calendar requirement

The admin calendar must represent **scheduled service appointments**, not simply the customer's preferred date.

Each calendar item should use:
- The scheduled service date.
- Scheduled start time.
- Service duration or scheduled end time.
- Booking status.
- Customer and service identity.

The admin must be able to distinguish a pending request from a confirmed appointment. Pending requests should not appear as confirmed scheduled work. If pending requests are shown in the calendar, make their status unmistakable and avoid treating them as confirmed availability.

Calendar views:
- Month view.
- Week view.
- A practical list/day view for reviewing details.

The calendar must be backed by persisted booking data, not static sample entries.

## 6. Authentication-first milestone

The first coding milestone is authentication and the minimum app foundation.

The agent must:
- Inspect the repository before editing.
- Search for existing login/authentication code and assess whether it can be reused or imported.
- Identify current database configuration and migrations.
- Explain any authentication assumptions that require a decision.
- Implement only the approved authentication scope.
- Protect admin routes from unauthenticated access.
- Keep secrets in environment variables and provide an `.env.example` with placeholder values only.
- Include validation, safe password handling, and session security appropriate to the chosen setup.
- Add clear setup and test instructions.

Do not implement the public design, booking modal, or full admin dashboard during this first milestone.

## 7. General engineering requirements

- Keep code modular and maintainable.
- Validate user input on the server.
- Use database migrations rather than ad hoc schema changes.
- Do not hardcode service prices into UI components when they should be managed in the database.
- Preserve a price snapshot on each booking so later price changes do not rewrite historical booking totals.
- Avoid adding dependencies without a clear need.
- Do not invent business rules where these documents are silent; list questions for approval.
- Keep documentation updated as implementation decisions are confirmed.

## 8. Definition of done for the first milestone

The first milestone is complete when:
- The repository audit has been documented.
- Existing authentication has been reused or a new approach approved and implemented.
- Admin login works.
- Protected admin routes reject unauthenticated requests.
- Logout works.
- Authentication-related validation and errors are handled.
- Database setup/migrations and environment setup are documented.
- Relevant tests or a clear manual verification checklist pass.
- No public website redesign or booking UI has been started.

## 9. Next milestone

After authentication is reviewed and accepted, proceed to the foundational database and booking model, then the admin booking/calendar workflows. The public one-page website is a later milestone.
