# Database Schema — Initial Requirements

## Purpose

Define the persistent data needed for authentication, services, customers, booking requests, scheduled appointments, and complaints. The agent should inspect the existing schema before proposing migrations.

## Initial entities

### AdminUser
Stores users allowed to access the admin area.

Suggested fields:
- id
- name
- email (unique)
- passwordHash (if local password auth is used)
- role or permission level, if needed
- createdAt
- updatedAt

Do not store plaintext passwords.

### Service
Represents a service offered by Amanda's.

Suggested fields:
- id
- name
- description
- pricing unit/type
- base price
- minimum quantity/duration where applicable
- active flag
- createdAt
- updatedAt

Services and prices should be database-driven so an admin can manage them later.

### Customer
Stores customer contact details associated with requests/bookings.

Suggested fields:
- id
- name
- phone
- email (optional depending on booking input)
- createdAt
- updatedAt

Customers do not need a public account for the initial booking flow.

### Booking
Represents a booking request and, once accepted, the scheduled service.

Suggested fields:
- id
- customerId
- serviceId
- requestedDate
- requestedTime
- scheduledStartAt (nullable until scheduled)
- scheduledEndAt or durationMinutes (depending on implementation)
- status
- address
- postcode
- instructions
- frequency (if applicable)
- quantity/duration inputs
- priceSnapshot
- adminNotes
- createdAt
- updatedAt

The exact shape should be finalized after reviewing the current repository and booking requirements.

### Complaint
Represents a customer complaint or issue.

Suggested fields:
- id
- customerId (optional if not identified)
- bookingId (optional)
- description
- status
- adminNotes
- createdAt
- updatedAt

## Important data rules

- A booking should retain the price quoted/accepted at the time of booking, even if the service's current price changes.
- Requested date/time and scheduled appointment date/time are separate concepts.
- Do not treat a requested time as a confirmed scheduled time automatically.
- Store enough information to calculate and display service duration.
- Use explicit booking statuses rather than inferring status from dates.
- Use migrations for schema changes.
- Add appropriate indexes and uniqueness constraints after reviewing query needs.

## Agent deliverables

Before creating migrations:
1. Inspect existing models and migrations.
2. Map existing models to these concepts.
3. Identify missing or conflicting fields.
4. Present proposed schema changes.
5. Implement after the schema plan is approved.
