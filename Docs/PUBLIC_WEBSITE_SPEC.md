# Public Website Specification

## Purpose

Describe the intended public-facing website for implementation in a later milestone. The agent is not receiving the HTML mockup as a design reference.

## Page structure

The public website should be a **single page** with sections and navigation links that scroll to the relevant section.

Expected sections:
- Header/navigation.
- Hero/introduction.
- Services.
- How it works.
- Pricing.
- Booking call to action.
- Contact/footer.

The exact copy and visual design should be decided in the design milestone. Do not invent a final brand design from this document alone.

## Booking interaction

- Booking opens in a modal/popup rather than navigating to a separate public booking page.
- Calls to action in relevant sections should open the same booking flow.
- The booking flow should submit a request, not automatically create a confirmed appointment.
- Service options and pricing should eventually be supplied from backend data.
- The form should collect customer contact details, service choice, requested date/time, service address, postcode, and relevant instructions.
- Show an estimate only when the calculation rules are implemented and validated.

## Implementation timing

Do not build the public page or booking modal during the initial login milestone. The current task is authentication and application foundation.
