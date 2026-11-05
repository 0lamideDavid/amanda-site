import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

const ADMIN_EMAIL = "admin@test.local";
const ADMIN_PASSWORD = "correct-password-123";

before(async () => {
  await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.adminUser.create({
    data: {
      name: "Test Admin",
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
    },
  });
});

after(async () => {
  await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.$disconnect();
});

test("unauthenticated request to an admin route redirects to login", async () => {
  const res = await request(app).get("/admin");
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, "/admin/login");
});

test("login page renders", async () => {
  const res = await request(app).get("/admin/login");
  assert.equal(res.status, 200);
});

test("rejects an unknown email with a generic error", async () => {
  const res = await request(app)
    .post("/admin/login")
    .type("form")
    .send({ email: "nobody@test.local", password: "whatever" });
  assert.equal(res.status, 401);
  assert.match(res.text, /Invalid email or password/);
});

test("rejects a known email with the wrong password", async () => {
  const res = await request(app)
    .post("/admin/login")
    .type("form")
    .send({ email: ADMIN_EMAIL, password: "wrong-password" });
  assert.equal(res.status, 401);
  assert.match(res.text, /Invalid email or password/);
});

test("logs in with valid credentials, reaches the admin area, then logs out and is locked out again", async () => {
  const agent = request.agent(app);

  const loginRes = await agent
    .post("/admin/login")
    .type("form")
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  assert.equal(loginRes.status, 302);
  assert.equal(loginRes.headers.location, "/admin");

  const adminRes = await agent.get("/admin");
  assert.equal(adminRes.status, 200);

  const logoutRes = await agent.post("/admin/logout");
  assert.equal(logoutRes.status, 302);
  assert.equal(logoutRes.headers.location, "/admin/login");

  const afterLogoutRes = await agent.get("/admin");
  assert.equal(afterLogoutRes.status, 302);
  assert.equal(afterLogoutRes.headers.location, "/admin/login");
});
