# Project Structure

## Guideline

First inspect the existing repository. Preserve useful conventions and working code. The structure below is a suggested organization if the project needs to be established or reorganized; it is not permission to overwrite existing files blindly.

## Suggested structure

```text
project-root/
├── docs/
│   ├── README.md
│   ├── AMANDAS_AGENT_BUILD_SPEC.md
│   ├── AUTHENTICATION_SPEC.md
│   ├── PROJECT_STRUCTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── BOOKING_SYSTEM_SPEC.md
│   ├── ADMIN_DASHBOARD_SPEC.md
│   ├── PUBLIC_WEBSITE_SPEC.md
│   └── IMPLEMENTATION_PHASES.md
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── admin.routes.ts
│   │   └── public.routes.ts
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── validators/
│   ├── views/
│   │   ├── layouts/
│   │   ├── auth/
│   │   ├── admin/
│   │   └── public/
│   └── public/
│       ├── css/
│       ├── js/
│       └── assets/
├── prisma/
│   └── schema.prisma
├── tests/
├── .env.example
├── package.json
└── README.md
```

## Organization rules

- Routes should define endpoints and connect middleware/controllers.
- Controllers should handle HTTP request/response concerns.
- Services should contain business rules.
- Repositories should handle database access.
- Validators should define server-side input validation.
- Views should be organized by auth, admin, and public site.
- Keep public and admin layouts separate.
- Do not introduce this structure if the repository already has a clean equivalent.
