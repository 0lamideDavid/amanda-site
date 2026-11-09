import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// Protects the one public, unauthenticated write endpoint from being
// spammed or scripted. 5 requests per 15 minutes per IP is generous for a
// genuine customer (even a couple of retries after a validation error)
// but blocks automated abuse.
//
// Disabled in tests: rate-limit state is per-process and shared across
// every test file that imports the app, so it would make unrelated tests
// flaky depending on how many requests ran before them. The limiter's own
// behavior is verified in isolation instead (tests/rateLimiter.test.ts).
export const bookingRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: { ok: false, errors: { formErrors: ["Too many requests. Please try again later."], fieldErrors: {} } },
});
