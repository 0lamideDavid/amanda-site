import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

const ADMIN_EMAIL = "admin-mgmt@test.local";
const ADMIN_PASSWORD = "mgmt-password-123";

let serviceId: string;
let customerId: string;
let bookingId: string;

before(async () => {
  await prisma.complaint.deleteMany({ where: { customer: { phone: { startsWith: "+44-mgmt-" } } } });
  await prisma.booking.deleteMany({ where: { customer: { phone: { startsWith: "+44-mgmt-" } } } });
  await prisma.customer.deleteMany({ where: { phone: { startsWith: "+44-mgmt-" } } });
  await prisma.service.deleteMany({ where: { name: { in: ["Test-only mgmt service", "Test-only mgmt new service"] } } });
  await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });

  await prisma.adminUser.create({
    data: { name: "Mgmt Admin", email: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10) },
  });

  const service = await prisma.service.create({
    data: {
      name: "Test-only mgmt service",
      description: "fixture",
      pricingUnit: "hourly",
      basePrice: "20.00",
      minimum: "1",
      active: true,
    },
  });
  serviceId = service.id;

  const customer = await prisma.customer.create({ data: { name: "Mgmt Customer", phone: "+44-mgmt-1" } });
  customerId = customer.id;

  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      serviceId: service.id,
      requestedDate: new Date("2027-07-01"),
      requestedTime: "Morning",
      address: "1 Mgmt Street",
      postcode: "PL1 1AA",
      status: "PENDING",
      priceSnapshot: "20.00",
    },
  });
  bookingId = booking.id;
});

after(async () => {
  await prisma.complaint.deleteMany({ where: { customer: { phone: { startsWith: "+44-mgmt-" } } } });
  await prisma.booking.deleteMany({ where: { customer: { phone: { startsWith: "+44-mgmt-" } } } });
  await prisma.customer.deleteMany({ where: { phone: { startsWith: "+44-mgmt-" } } });
  await prisma.service.deleteMany({ where: { name: { in: ["Test-only mgmt service", "Test-only mgmt new service"] } } });
  await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.$disconnect();
});

async function loggedInAgent() {
  const agent = request.agent(app);
  await agent.post("/admin/login").type("form").send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  return agent;
}

test("services list renders and the new-service form creates a service", async () => {
  const agent = await loggedInAgent();
  const listRes = await agent.get("/admin/services");
  assert.equal(listRes.status, 200);
  assert.match(listRes.text, /Test-only mgmt service/);

  const createRes = await agent
    .post("/admin/services")
    .type("form")
    .send({
      name: "Test-only mgmt new service",
      description: "created via test",
      pricingUnit: "flat",
      basePrice: "30",
      active: "on",
    });
  assert.equal(createRes.status, 302);

  const created = await prisma.service.findFirst({ where: { name: "Test-only mgmt new service" } });
  assert.ok(created);
  assert.equal(created?.active, true);
});

test("updating a service's price does not rewrite an existing booking's priceSnapshot", async () => {
  const agent = await loggedInAgent();

  const beforeBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
  assert.equal(beforeBooking?.priceSnapshot?.toString(), "20");

  const res = await agent
    .post(`/admin/services/${serviceId}`)
    .type("form")
    .send({
      name: "Test-only mgmt service",
      description: "fixture, price changed",
      pricingUnit: "hourly",
      basePrice: "99.00",
      minimum: "1",
      active: "on",
    });
  assert.equal(res.status, 302);

  const serviceAfter = await prisma.service.findUnique({ where: { id: serviceId } });
  assert.equal(serviceAfter?.basePrice?.toString(), "99");

  const bookingAfter = await prisma.booking.findUnique({ where: { id: bookingId } });
  assert.equal(bookingAfter?.priceSnapshot?.toString(), "20"); // unchanged
});

test("unchecking the active checkbox deactivates a service", async () => {
  const agent = await loggedInAgent();
  const res = await agent
    .post(`/admin/services/${serviceId}`)
    .type("form")
    .send({
      name: "Test-only mgmt service",
      description: "fixture",
      pricingUnit: "hourly",
      basePrice: "99.00",
      minimum: "1",
      // "active" field omitted entirely, as a real unchecked checkbox would do
    });
  assert.equal(res.status, 302);

  const serviceAfter = await prisma.service.findUnique({ where: { id: serviceId } });
  assert.equal(serviceAfter?.active, false);

  const activeServices = await prisma.service.findMany({ where: { active: true, id: serviceId } });
  assert.equal(activeServices.length, 0);
});

test("customer detail page shows booking history and the edit form updates contact details", async () => {
  const agent = await loggedInAgent();
  const detailRes = await agent.get(`/admin/customers/${customerId}`);
  assert.equal(detailRes.status, 200);
  assert.match(detailRes.text, /Test-only mgmt service/);

  const updateRes = await agent
    .post(`/admin/customers/${customerId}`)
    .type("form")
    .send({ name: "Mgmt Customer Updated", phone: "+44-mgmt-1", email: "updated@test.local" });
  assert.equal(updateRes.status, 302);

  const updated = await prisma.customer.findUnique({ where: { id: customerId } });
  assert.equal(updated?.name, "Mgmt Customer Updated");
  assert.equal(updated?.email, "updated@test.local");
});

test("logging a complaint against a booking links it, and the status can be updated", async () => {
  const agent = await loggedInAgent();
  const createRes = await agent
    .post("/admin/complaints")
    .type("form")
    .send({ customerId, bookingId, description: "Missed a spot under the sink." });
  assert.equal(createRes.status, 302);

  const complaint = await prisma.complaint.findFirstOrThrow({ where: { bookingId } });
  assert.equal(complaint.customerId, customerId);
  assert.equal(complaint.status, "open");

  const listRes = await agent.get("/admin/complaints");
  assert.equal(listRes.status, 200);
  assert.match(listRes.text, /Missed a spot under the sink\./);

  const updateRes = await agent
    .post(`/admin/complaints/${complaint.id}`)
    .type("form")
    .send({ status: "resolved", adminNotes: "Re-cleaned free of charge." });
  assert.equal(updateRes.status, 302);

  const updated = await prisma.complaint.findUnique({ where: { id: complaint.id } });
  assert.equal(updated?.status, "resolved");
  assert.equal(updated?.adminNotes, "Re-cleaned free of charge.");
});
