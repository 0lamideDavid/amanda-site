# Booking System Specification

## Purpose

Provide a reliable way to receive service requests and manage scheduled cleaning/errand appointments.

## Booking request flow

The public website will eventually allow a customer to:
- Choose a service.
- Provide required quantity, duration, or turnover details.
- Select a preferred frequency where applicable.
- Submit a preferred date and time.
- Provide name and contact details.
- Provide postcode, service address, and instructions.
- Review an estimate where supported.
- Submit the request.

A submitted request is not automatically a confirmed appointment.

## Status distinction

The system must distinguish at least:
- Pending request.
- Confirmed appointment.
- Reschedule requested or awaiting confirmation, if used.
- In progress.
- Completed.
- Cancelled.

The agent should propose a clear status model and document transitions. Do not silently treat pending requests as confirmed work.

## Scheduling fields

A booking should preserve:
- Customer's requested date/time.
- Actual scheduled service date.
- Actual scheduled start time.
- Service duration or scheduled end time.
- Booking status.

If an admin confirms or reschedules a booking, the actual scheduled fields should be updated. The customer's original requested values should remain available for reference.

## Calendar requirements

The admin calendar must:
- Display scheduled service date and time.
- Represent duration visually or clearly show start/end.
- Distinguish pending requests from confirmed appointments.
- Support month and week views.
- Provide a list/day view for operational review.
- Open a booking detail view when an appointment is selected.
- Use real persisted booking data.
- Avoid showing unscheduled pending requests as confirmed calendar events.

The calendar should support practical conflict checking. Before confirming or moving a booking, check for overlapping scheduled work based on service duration and the business's scheduling rules. If staff assignment or working hours are not yet defined, ask rather than inventing rules.

## Admin actions

The admin should eventually be able to:
- Review pending requests.
- Confirm a request and assign its actual scheduled date/time.
- Reschedule a booking.
- Cancel a booking.
- Mark work as in progress.
- Mark work as completed.
- Add internal notes.
- View customer and service details.

Record relevant status changes and timestamps where appropriate.

## Pricing

- Service pricing should come from the service records.
- Calculate estimates from the chosen service and its pricing unit.
- Keep a price snapshot on the booking.
- Admin changes to current service pricing must not alter historical booking amounts.

## Initial implementation boundary

Do not build the booking form or calendar during the authentication-first milestone. This document is for the later booking milestone after the foundational structure is reviewed.
