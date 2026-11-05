# Amanda's — Project Documentation

This folder contains the project requirements and implementation guidance for Amanda's cleaning and errand service website and management system.

## Read first

1. [`AMANDAS_AGENT_BUILD_SPEC.md`](./AMANDAS_AGENT_BUILD_SPEC.md) — main project brief and implementation order.
2. [`AUTHENTICATION_SPEC.md`](./AUTHENTICATION_SPEC.md) — login and authentication foundation.
3. [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) — application organization and conventions.
4. [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) — initial data model.
5. [`BOOKING_SYSTEM_SPEC.md`](./BOOKING_SYSTEM_SPEC.md) — booking workflow and calendar requirements.
6. [`ADMIN_DASHBOARD_SPEC.md`](./ADMIN_DASHBOARD_SPEC.md) — admin operations.
7. [`PUBLIC_WEBSITE_SPEC.md`](./PUBLIC_WEBSITE_SPEC.md) — one-page public website requirements, to be implemented after foundation.
8. [`IMPLEMENTATION_PHASES.md`](./IMPLEMENTATION_PHASES.md) — milestone order and completion checks.

## Agent instructions

- Start by auditing the existing repository. Do not assume it is empty.
- Authentication is the first implementation task.
- The user may import or reuse an existing authentication implementation. Inspect for it before creating a replacement.
- Do not begin public website styling/design or booking UI during the initial authentication milestone.
- The supplied HTML mockup is not being provided to the agent as a design reference. Follow the written requirements in these documents.
- Keep the public website as a single page with section navigation. The booking form is intended to open in a modal/popup from relevant calls to action.
- Build only the current milestone. Do not jump ahead to later features without approval.
