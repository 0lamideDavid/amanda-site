import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

let activeServiceId: string;
let inactiveServiceId: string;

before(async () => {
  await prisma.booking.deleteMany({ where: { customer: { phone: { startsWith: "+44-pub-" } } } });
  await prisma.customer.deleteMany({ where: { phone: { startsWith: "+44-pub-" } } });
  await prisma.service.deleteMany({
    where: { name: { in: ["Test-only public active service", "Test-only public inactive service"] } },
  });

  const active = await prisma.service.create({
    data: {
      name: "Test-only public active service",
      description: "fixture",
      pricingUnit: "hourly",
      basePrice: "20.00",
      minimum: "2",
      active: true,
    },
  });
  activeServiceId = active.id;

  const inactive = await prisma.service.create({
    data: {
      name: "Test-only public inactive service",
      description: "fixture",
      pricingUnit: "hourly",
      basePrice: "20.00",
      active: false,
    },
  });
  inactiveServiceId = inactive.id;
});

after(async () => {
  await prisma.booking.deleteMany({ where: { customer: { phone: { startsWith: "+44-pub-" } } } });
  await prisma.customer.deleteMany({ where: { phone: { startsWith: "+44-pub-" } } });
  await prisma.service.deleteMany({
    where: { name: { in: ["Test-only public active service", "Test-only public inactive service"] } },
  });
  await prisma.$disconnect();
});

test("home page renders and lists active services but not inactive ones", async () => {
  const res = await request(app).get("/");
  assert.equal(res.status, 200);
  assert.match(res.text, /Test-only public active service/);
  assert.doesNotMatch(res.text, /Test-only public inactive service/);
});

test("submitting a valid booking request creates a PENDING booking with a computed price, unscheduled", async () => {
  const res = await request(app)
    .post("/booking-requests")
    .send({
      serviceId: activeServiceId,
      requestedDate: "2027-09-01",
      requestedTime: "Morning",
      frequency: "One-off",
      quantity: 3,
      address: "1 Public Street",
      postcode: "PL1 1AA",
      customer: { name: "Public Tester", phone: "+44-pub-1", email: "pub1@test.local" },
    });
  assert.equal(res.status, 201);
  assert.equal(res.body.ok, true);

  const booking = await prisma.booking.findUnique({ where: { id: res.body.bookingId } });
  assert.equal(booking?.status, "PENDING");
  assert.equal(booking?.scheduledStartAt, null);
  assert.equal(booking?.priceSnapshot?.toString(), "60"); // 3hrs * £20/hr
});

test("a malformed request returns 400 with field errors, not a crash", async () => {
  const res = await request(app).post("/booking-requests").send({ serviceId: "not-a-uuid" });
  assert.equal(res.status, 400);
  assert.equal(res.body.ok, false);
  assert.ok(res.body.errors.fieldErrors.serviceId);
});

test("booking an inactive service is rejected with 400, not a 500", async () => {
  const res = await request(app)
    .post("/booking-requests")
    .send({
      serviceId: inactiveServiceId,
      requestedDate: "2027-09-01",
      requestedTime: "Morning",
      address: "1 Public Street",
      postcode: "PL1 1AA",
      customer: { name: "Public Tester", phone: "+44-pub-2" },
    });
  assert.equal(res.status, 400);
  assert.equal(res.body.ok, false);
});

test("two requests from the same phone number share one customer record", async () => {
  const payload = {
    serviceId: activeServiceId,
    requestedDate: "2027-09-05",
    requestedTime: "Afternoon",
    address: "2 Public Street",
    postcode: "PL1 1AA",
    customer: { name: "Repeat Public Tester", phone: "+44-pub-3" },
  };
  const first = await request(app).post("/booking-requests").send(payload);
  const second = await request(app).post("/booking-requests").send(payload);
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);

  const firstBooking = await prisma.booking.findUnique({ where: { id: first.body.bookingId } });
  const secondBooking = await prisma.booking.findUnique({ where: { id: second.body.bookingId } });
  assert.equal(firstBooking?.customerId, secondBooking?.customerId);
});
