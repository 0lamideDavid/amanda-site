import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import rateLimit from "express-rate-limit";
import request from "supertest";

// Verifies the actual express-rate-limit configuration pattern used by
// src/middleware/rateLimiter.ts, on its own throwaway app rather than the
// shared one. The real bookingRequestLimiter is disabled in tests (its
// state is per-process and shared across every test file importing the
// app, which would make unrelated tests flaky), so its mechanics are
// proven here instead, with a low limit for a fast, deterministic test.
test("rate limiter allows requests under the limit and blocks over it with a 429", async () => {
  const app = express();
  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 2,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, errors: { formErrors: ["Too many requests. Please try again later."], fieldErrors: {} } },
  });
  app.post("/test-endpoint", limiter, (req, res) => res.status(201).json({ ok: true }));

  const agent = request.agent(app);
  const first = await agent.post("/test-endpoint");
  const second = await agent.post("/test-endpoint");
  const third = await agent.post("/test-endpoint");

  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal(third.status, 429);
  assert.equal(third.body.ok, false);
  assert.match(third.body.errors.formErrors[0], /Too many requests/);
});
