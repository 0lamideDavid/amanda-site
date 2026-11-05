# Authentication Specification

## Purpose

Implement the login foundation for the private admin system. Authentication is the first coding milestone.

## Before implementation

1. Inspect the repository for existing authentication.
2. Check whether the user intends to import or reuse an existing auth implementation.
3. Review its framework compatibility, database assumptions, session handling, and route protection.
4. Report whether it can be integrated safely.
5. Do not create a competing authentication system before this audit.

## Initial scope

- Admin login.
- Logout.
- Protected admin routes.
- Session persistence.
- Server-side input validation.
- Safe password verification if local password authentication is used.
- Authentication error handling.
- Environment configuration.
- Tests or verification steps.

## Security and implementation notes

- Never commit secrets, credentials, or production session keys.
- Use environment variables and provide an `.env.example` containing placeholders.
- Use a secure password hashing implementation if storing passwords locally; never store plaintext passwords.
- Configure session cookies with appropriate `httpOnly`, `sameSite`, and production `secure` settings.
- Regenerate the session after successful login.
- Enforce authentication in server middleware, not only in the frontend.
- Avoid revealing whether a particular account exists in login error messages.
- Validate and normalize login input.
- Do not log passwords, session identifiers, or secrets.
- Use HTTPS in production.
- Keep authentication dependencies minimal and maintained.

## Decisions to document

The agent should record:
- Existing auth found (if any).
- Whether it is reused, imported, or replaced.
- Admin account creation/provisioning method.
- Session store choice.
- Password reset approach, if needed for the initial milestone.
- Any unresolved security or configuration questions.

Do not invent answers to unresolved business or deployment questions. Ask for approval.

## Verification checklist

- [ ] Valid admin credentials allow login.
- [ ] Invalid credentials are rejected safely.
- [ ] Protected routes redirect or reject unauthenticated users.
- [ ] Logout invalidates the session.
- [ ] Session changes after login.
- [ ] Session cookie flags are configured correctly for the environment.
- [ ] Secrets are not committed.
- [ ] Authentication tests or manual checks are documented.
