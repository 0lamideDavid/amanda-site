# Admin Dashboard Specification

## Purpose

Create a private admin area for managing Amanda's service requests and business operations.

## Access

- Admin routes must require authentication.
- Authentication must be enforced server-side.
- The admin area should use a layout separate from the public website.
- Do not implement role complexity unless it is needed and approved.

## Main areas

### Overview
A summary of operational information, such as pending requests and upcoming scheduled services. Use real database data when implemented.

### Bookings
- View booking requests and appointments.
- Filter by status and date.
- Open booking details.
- Confirm, reschedule, cancel, start, or complete a booking according to the approved workflow.
- Add internal notes.

### Calendar
- Month and week views.
- List/day view.
- Show scheduled date, start time, and duration/end time.
- Clearly distinguish pending requests from confirmed appointments.
- Use actual persisted bookings.
- Selecting a calendar item opens its details.

### Services and pricing
- View and manage services.
- Update descriptions and current prices.
- Configure relevant pricing units and minimums.
- Activate/deactivate services.
- Preserve booking price snapshots.

### Customers
- View customer records and their booking history.
- Update customer contact details where appropriate.
- Customers do not need a public account for the initial booking flow.

### Complaints
- Record and review complaints.
- Link a complaint to a customer or booking when known.
- Track complaint status and admin notes.

## Admin usability

- Keep navigation clear and operationally focused.
- Use confirmation prompts for destructive or consequential actions.
- Display status labels consistently.
- Validate all changes on the server.
- Do not rely on frontend-only permissions.

## Implementation timing

The dashboard is not part of the first authentication milestone. Build it after authentication and foundational data models are reviewed.
