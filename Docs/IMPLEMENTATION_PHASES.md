# Implementation Phases

Follow these phases in order. Pause for review at the end of each milestone.

## Phase 0 — Repository audit

- Inspect the current repository and package scripts.
- Identify framework, language, folder structure, database, and migration status.
- Search for existing login/authentication code.
- Identify what can be reused or imported.
- Report risks, missing configuration, and recommended next steps.
- Do not redesign or overwrite existing code.

**Review gate:** approve the authentication approach.

## Phase 1 — Authentication

- Implement or integrate the approved login.
- Add logout.
- Protect admin routes.
- Configure sessions and environment variables.
- Add validation and error handling.
- Add tests or documented manual checks.
- Update setup instructions.

**Review gate:** verify login, logout, and protected routes before continuing.

## Phase 2 — Foundation and data model

- Confirm app structure.
- Review initial database entities.
- Add approved migrations.
- Establish service/repository patterns if appropriate.
- Seed only necessary development data.
- Document local setup.

**Review gate:** approve schema and migration behavior.

## Phase 3 — Booking workflow

- Implement booking request persistence.
- Add explicit booking statuses.
- Separate requested date/time from scheduled date/time.
- Add admin confirmation and rescheduling actions.
- Preserve booking price snapshots.
- Add conflict checking based on confirmed scheduling rules.

**Review gate:** verify status transitions and scheduling logic.

## Phase 4 — Admin booking views and calendar

- Build booking list and detail view.
- Build month/week calendar and useful list/day view.
- Display scheduled date and duration.
- Visually distinguish pending requests from confirmed appointments.
- Use persisted booking data.
- Add filtering and operational actions.

**Review gate:** verify calendar behavior with pending, confirmed, rescheduled, cancelled, and completed bookings.

## Phase 5 — Admin management

- Services and pricing.
- Customers.
- Complaints.
- Overview/dashboard summaries.

**Review gate:** verify CRUD, validation, and booking history behavior.

## Phase 6 — Public one-page website

- Build the one-page public layout.
- Add section navigation.
- Add service and pricing sections.
- Add booking modal opened by relevant calls to action.
- Connect form submission to the booking backend.
- Confirm responsive behavior and accessibility.

**Review gate:** review public flow end to end.

## Phase discipline

- Implement only the current phase.
- Do not skip review gates.
- If a requirement is unclear, ask before choosing a business rule.
- Keep this document updated when the user approves a change.
