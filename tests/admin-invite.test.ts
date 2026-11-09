import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

const ADMIN_EMAIL = "admin-invite-test@test.local";
const ADMIN_PASSWORD = "invite-test-password-123";
const INVITEE_EMAIL = "invitee@test.local";

before(async () => {
  await prisma.adminUser.deleteMany({ where: { email: { in: [ADMIN_EMAIL, INVITEE_EMAIL] } } });
  await prisma.adminUser.create({
    data: { name: "Invite Test Admin", email: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10) },
  });
});

after(async () => {
  await prisma.adminUser.deleteMany({ where: { email: { in: [ADMIN_EMAIL, INVITEE_EMAIL] } } });
  await prisma.$disconnect();
});

async function loggedInAgent() {
  const agent = request.agent(app);
  await agent.post("/admin/login").type("form").send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  return agent;
}

test("unauthenticated access to team routes redirects to login", async () => {
  const listRes = await request(app).get("/admin/team");
  assert.equal(listRes.status, 302);
  assert.equal(listRes.headers.location, "/admin/login");

  const inviteRes = await request(app).post("/admin/team/invite");
  assert.equal(inviteRes.status, 302);
  assert.equal(inviteRes.headers.location, "/admin/login");
});

test("team page lists existing admins and the invite form", async () => {
  const agent = await loggedInAgent();
  const res = await agent.get("/admin/team");
  assert.equal(res.status, 200);
  assert.match(res.text, /Invite Test Admin/);
  assert.match(res.text, /Invite another admin/);
});

test("inviting a new admin creates a pending AdminUser with a token", async () => {
  const agent = await loggedInAgent();
  const res = await agent
    .post("/admin/team/invite")
    .type("form")
    .send({ name: "New Invitee", email: INVITEE_EMAIL });
  assert.equal(res.status, 302);
  assert.match(res.headers.location, /success=/);

  const invitee = await prisma.adminUser.findUnique({ where: { email: INVITEE_EMAIL } });
  assert.ok(invitee);
  assert.ok(invitee?.inviteToken);
  assert.ok(invitee?.inviteTokenExpiresAt && invitee.inviteTokenExpiresAt.getTime() > Date.now());

  const listRes = await agent.get("/admin/team");
  assert.match(listRes.text, /Invite pending/);
});

test("re-inviting a still-pending admin issues a fresh token instead of duplicating", async () => {
  const beforeInvite = await prisma.adminUser.findUniqueOrThrow({ where: { email: INVITEE_EMAIL } });

  const agent = await loggedInAgent();
  const res = await agent
    .post("/admin/team/invite")
    .type("form")
    .send({ name: "New Invitee", email: INVITEE_EMAIL });
  assert.equal(res.status, 302);

  const afterInvite = await prisma.adminUser.findUniqueOrThrow({ where: { email: INVITEE_EMAIL } });
  assert.equal(afterInvite.id, beforeInvite.id); // same row, not a duplicate
  assert.notEqual(afterInvite.inviteToken, beforeInvite.inviteToken); // fresh token

  const count = await prisma.adminUser.count({ where: { email: INVITEE_EMAIL } });
  assert.equal(count, 1);
});

test("inviting an email that's already an active admin is rejected", async () => {
  const agent = await loggedInAgent();
  const res = await agent
    .post("/admin/team/invite")
    .type("form")
    .send({ name: "Duplicate", email: ADMIN_EMAIL });
  assert.equal(res.status, 302);
  assert.match(res.headers.location, /error=/);

  const count = await prisma.adminUser.count({ where: { email: ADMIN_EMAIL } });
  assert.equal(count, 1);
});

test("an invalid or missing invite token shows the invalid-invite page, not a crash", async () => {
  const missing = await request(app).get("/admin/accept-invite");
  assert.equal(missing.status, 200);
  assert.match(missing.text, /doesn't work|invalid/i);

  const bogus = await request(app).get("/admin/accept-invite?token=not-a-real-token");
  assert.equal(bogus.status, 200);
  assert.match(bogus.text, /doesn't work|invalid/i);
});

test("an expired invite token is rejected", async () => {
  const invitee = await prisma.adminUser.findUniqueOrThrow({ where: { email: INVITEE_EMAIL } });
  await prisma.adminUser.update({
    where: { id: invitee.id },
    data: { inviteTokenExpiresAt: new Date(Date.now() - 1000) },
  });

  const res = await request(app).get(`/admin/accept-invite?token=${invitee.inviteToken}`);
  assert.equal(res.status, 200);
  assert.match(res.text, /expired/i);

  // restore a valid expiry for the next tests
  await prisma.adminUser.update({
    where: { id: invitee.id },
    data: { inviteTokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) },
  });
});

test("accepting an invite with mismatched passwords is rejected", async () => {
  const invitee = await prisma.adminUser.findUniqueOrThrow({ where: { email: INVITEE_EMAIL } });
  const res = await request(app)
    .post("/admin/accept-invite")
    .type("form")
    .send({ token: invitee.inviteToken, password: "password-one-123", confirmPassword: "password-two-123" });
  assert.equal(res.status, 400);
  assert.match(res.text, /match/i);

  const stillPending = await prisma.adminUser.findUniqueOrThrow({ where: { id: invitee.id } });
  assert.ok(stillPending.inviteToken); // unchanged — not accepted
});

test("accepting a valid invite sets a real password, logs the invitee in, and the token can't be reused", async () => {
  const invitee = await prisma.adminUser.findUniqueOrThrow({ where: { email: INVITEE_EMAIL } });
  const token = invitee.inviteToken!;
  const newPassword = "brand-new-password-456";

  const agent = request.agent(app);
  const acceptRes = await agent
    .post("/admin/accept-invite")
    .type("form")
    .send({ token, password: newPassword, confirmPassword: newPassword });
  assert.equal(acceptRes.status, 302);
  assert.equal(acceptRes.headers.location, "/admin");

  // Logged in immediately as part of accepting.
  const overviewRes = await agent.get("/admin");
  assert.equal(overviewRes.status, 200);

  const updated = await prisma.adminUser.findUniqueOrThrow({ where: { id: invitee.id } });
  assert.equal(updated.inviteToken, null);
  assert.equal(updated.inviteTokenExpiresAt, null);

  // The token is now gone from the row, so re-using the same token string
  // in the URL can't possibly resolve to this (or any) admin.
  const reuseRes = await request(app).get(`/admin/accept-invite?token=${token}`);
  assert.match(reuseRes.text, /doesn't work|invalid/i);

  // And the invitee can now log in normally with their own password.
  const loginRes = await request(app)
    .post("/admin/login")
    .type("form")
    .send({ email: INVITEE_EMAIL, password: newPassword });
  assert.equal(loginRes.status, 302);
  assert.equal(loginRes.headers.location, "/admin");
});
