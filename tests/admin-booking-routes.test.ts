import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

const ADMIN_EMAIL = "admin-routes@test.local";
const ADMIN_PASSWORD = "routes-password-123";
const SCHEDULED_DATE = new Date("2027-06-15T10:00:00Z");

let serviceId: string;
let pendingBookingId: string;

before(async () => {
  await prisma.booking.deleteMany({ where: { customer: { phone: { startsWith: "+44-routes-" } } } });
  await prisma.customer.deleteMany({ where: { phone: { startsWith: "+44-routes-" } } });
  await prisma.service.deleteMany({ where: { name: "Test-only routes service" } });
  await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });

  await prisma.adminUser.create({
    data: { name: "Routes Admin", email: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10) },
  });

  const service = await prisma.service.create({
    data: {
      name: "Test-only routes service",
      description: "fixture",
      pricingUnit: "hourly",
      basePrice: "20.00",
      minimum: "1",
      active: true,
    },
  });
  serviceId = service.id;

  const customer = await prisma.customer.create({ data: { name: "Routes Customer", phone: "+44-routes-1" } });

  await prisma.booking.create({
    data: {
      customerId: customer.id,
      serviceId: service.id,
      requestedDate: SCHEDULED_DATE,
      requestedTime: "Morning",
      address: "1 Routes Street",
      postcode: "PL1 1AA",
      status: "CONFIRMED",
      scheduledStartAt: SCHEDULED_DATE,
      scheduledEndAt: new Date(SCHEDULED_DATE.getTime() + 60 * 60 * 1000),
      priceSnapshot: "20.00",
    },
  });

  const pending = await prisma.booking.create({
    data: {
      customerId: customer.id,
      serviceId: service.id,
      requestedDate: SCHEDULED_DATE,
      requestedTime: "Afternoon",
      address: "1 Routes Street",
      postcode: "PL1 1AA",
      status: "PENDING",
      priceSnapshot: "20.00",
    },
  });
  pendingBookingId = pending.id;
});

after(async () => {
  await prisma.booking.deleteMany({ where: { customer: { phone: { startsWith: "+44-routes-" } } } });
  await prisma.customer.deleteMany({ where: { phone: { startsWith: "+44-routes-" } } });
  await prisma.service.deleteMany({ where: { name: "Test-only routes service" } });
  await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.$disconnect();
});

// datetime-local form inputs (and this test's POST bodies, to match) carry
// no timezone — the server parses them as local time, same as a real
// browser would. Format with local getters, not toISOString, or the string
// silently shifts by the host's UTC offset.
function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function loggedInAgent() {
  const agent = request.agent(app);
  await agent.post("/admin/login").type("form").send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  return agent;
}

test("bookings list shows bookings regardless of status", async () => {
  const agent = await loggedInAgent();
  const res = await agent.get("/admin/bookings");
  assert.equal(res.status, 200);
  assert.match(res.text, /Test-only routes service/);
});

test("booking detail page shows the confirm form for a pending booking", async () => {
  const agent = await loggedInAgent();
  const res = await agent.get(`/admin/bookings/${pendingBookingId}`);
  assert.equal(res.status, 200);
  assert.match(res.text, /Confirm booking/);
});

test("month calendar shows the confirmed booking but never a pending request", async () => {
  const agent = await loggedInAgent();
  const res = await agent.get("/admin/calendar/month?date=2027-06-01");
  assert.equal(res.status, 200);
  assert.match(res.text, /Test-only routes service/);
  assert.doesNotMatch(res.text, /Afternoon/);
});

test("day calendar separates scheduled bookings from same-day pending requests", async () => {
  const agent = await loggedInAgent();
  const res = await agent.get("/admin/calendar/day?date=2027-06-15");
  assert.equal(res.status, 200);
  assert.match(res.text, /Scheduled/);
  assert.match(res.text, /Pending requests for this date/);
});

test("confirming a pending booking through the HTTP endpoint updates its status", async () => {
  const agent = await loggedInAgent();
  const res = await agent
    .post(`/admin/bookings/${pendingBookingId}/confirm`)
    .type("form")
    .send({ scheduledStartAt: "2027-06-20T09:00", scheduledEndAt: "2027-06-20T10:00" });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, `/admin/bookings/${pendingBookingId}`);

  const updated = await prisma.booking.findUnique({ where: { id: pendingBookingId } });
  assert.equal(updated?.status, "CONFIRMED");
});

test("confirming into an overlapping slot redirects back with an error instead of crashing", async () => {
  const agent = await loggedInAgent();
  const customer = await prisma.customer.findFirstOrThrow({ where: { phone: "+44-routes-1" } });
  const fresh = await prisma.booking.create({
    data: {
      customerId: customer.id,
      serviceId,
      requestedDate: SCHEDULED_DATE,
      requestedTime: "Evening",
      address: "1 Routes Street",
      postcode: "PL1 1AA",
      status: "PENDING",
      priceSnapshot: "20.00",
    },
  });

  const res = await agent
    .post(`/admin/bookings/${fresh.id}/confirm`)
    .type("form")
    .send({
      scheduledStartAt: toLocalInputValue(SCHEDULED_DATE),
      scheduledEndAt: toLocalInputValue(new Date(SCHEDULED_DATE.getTime() + 30 * 60 * 1000)),
    });
  assert.equal(res.status, 302);
  assert.match(res.headers.location ?? "", /error=/);

  const stillPending = await prisma.booking.findUnique({ where: { id: fresh.id } });
  assert.equal(stillPending?.status, "PENDING");
});
