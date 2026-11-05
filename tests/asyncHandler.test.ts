import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { ErrorRequestHandler } from "express";
import request from "supertest";
import { asyncHandler } from "../src/utils/asyncHandler";

function buildTestApp() {
  const app = express();

  app.get(
    "/throws-async",
    asyncHandler(async () => {
      throw new Error("boom from an async handler");
    }),
  );

  app.get(
    "/throws-sync",
    asyncHandler(() => {
      throw new Error("boom from a sync handler");
    }),
  );

  app.get(
    "/ok",
    asyncHandler(async (req, res) => {
      res.json({ ok: true });
    }),
  );

  const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);
    res.status(500).send("handled");
  };
  app.use(errorHandler);

  return app;
}

test("asyncHandler forwards a rejected async handler to the error middleware instead of hanging", async () => {
  const app = buildTestApp();
  const res = await request(app).get("/throws-async");
  assert.equal(res.status, 500);
  assert.equal(res.text, "handled");
});

test("asyncHandler forwards a synchronously-thrown error too", async () => {
  const app = buildTestApp();
  const res = await request(app).get("/throws-sync");
  assert.equal(res.status, 500);
  assert.equal(res.text, "handled");
});

test("asyncHandler does not interfere with a normal successful handler", async () => {
  const app = buildTestApp();
  const res = await request(app).get("/ok");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true });
});
