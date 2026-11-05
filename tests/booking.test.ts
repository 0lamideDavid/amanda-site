import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/config/prisma";
import {
  createBookingRequest,
  confirmBooking,
  rescheduleBooking,
  cancelBooking,
  startBooking,
  completeBooking,
} from "../src/services/booking.service";
import { BookingConflictError, InvalidBookingTransitionError } from "../src/services/booking.errors";

let hourlyServiceId: string;
let quoteServiceId: string;

before(async () => {
  await prisma.booking.deleteMany({ where: { customer: { phone: { startsWith: "+44-test-" } } } });
  await prisma.customer.deleteMany({ where: { phone: { startsWith: "+44-test-" } } });
  await prisma.service.deleteMany({ where: { name: { in: ["Test-only hourly service", "Test-only quote service"] } } });

  const hourly = await prisma.service.create({
    data: {
      name: "Test-only hourly service",
      description: "fixture",
      pricingUnit: "hourly",
      basePrice: "20.00",
      minimum: "2",
      active: true,
    },
  });
  hourlyServiceId = hourly.id;

  const quote = await prisma.service.create({
    data: {
      name: "Test-only quote service",
      description: "fixture",
      pricingUnit: "quote",
      active: true,
    },
  });
  quoteServiceId = quote.id;
});

after(async () => {
  await prisma.booking.deleteMany({ where: { customer: { phone: { startsWith: "+44-test-" } } } });
  await prisma.customer.deleteMany({ where: { phone: { startsWith: "+44-test-" } } });
  await prisma.service.deleteMany({ where: { name: { in: ["Test-only hourly service", "Test-only quote service"] } } });
  await prisma.$disconnect();
});

function baseRequest(phone: string, serviceId: string, overrides: Record<string, unknown> = {}) {
  return {
    serviceId,
    requestedDate: new Date("2027-01-10"),
    requestedTime: "Morning",
    address: "1 Test Street",
    postcode: "PL1 1AA",
    customer: { name: "Test Customer", phone },
    ...overrides,
  };
}

test("creating a booking request snapshots price for an hourly service, enforcing the minimum", async () => {
  const booking = await createBookingRequest(baseRequest("+44-test-1", hourlyServiceId, { quantity: 1 }));
  assert.equal(booking.status, "PENDING");
  assert.equal(booking.priceSnapshot?.toString(), "40"); // 2hr minimum * £20
});

test("creating a booking request against a quote service leaves priceSnapshot null", async () => {
  const booking = await createBookingRequest(baseRequest("+44-test-2", quoteServiceId));
  assert.equal(booking.priceSnapshot, null);
});

test("confirming, starting, and completing a booking follows the status chain", async () => {
  const booking = await createBookingRequest(baseRequest("+44-test-3", hourlyServiceId, { quantity: 3 }));
  assert.equal(booking.priceSnapshot?.toString(), "60");

  const confirmed = await confirmBooking(booking.id, {
    scheduledStartAt: new Date("2027-01-10T09:00:00Z"),
    scheduledEndAt: new Date("2027-01-10T12:00:00Z"),
  });
  assert.equal(confirmed.status, "CONFIRMED");

  const inProgress = await startBooking(booking.id);
  assert.equal(inProgress.status, "IN_PROGRESS");

  const completed = await completeBooking(booking.id);
  assert.equal(completed.status, "COMPLETED");
});

test("cannot start a booking that hasn't been confirmed", async () => {
  const booking = await createBookingRequest(baseRequest("+44-test-4", hourlyServiceId));
  await assert.rejects(() => startBooking(booking.id), InvalidBookingTransitionError);
});

test("cannot transition out of a cancelled booking", async () => {
  const booking = await createBookingRequest(baseRequest("+44-test-5", hourlyServiceId));
  await cancelBooking(booking.id, "customer cancelled");
  await assert.rejects(() => confirmBooking(booking.id, {
    scheduledStartAt: new Date("2027-01-11T09:00:00Z"),
    scheduledEndAt: new Date("2027-01-11T11:00:00Z"),
  }), InvalidBookingTransitionError);
});

test("confirming a second booking into an overlapping window throws BookingConflictError", async () => {
  const first = await createBookingRequest(baseRequest("+44-test-6", hourlyServiceId));
  await confirmBooking(first.id, {
    scheduledStartAt: new Date("2027-02-01T09:00:00Z"),
    scheduledEndAt: new Date("2027-02-01T11:00:00Z"),
  });

  const second = await createBookingRequest(baseRequest("+44-test-7", hourlyServiceId));
  await assert.rejects(
    () =>
      confirmBooking(second.id, {
        scheduledStartAt: new Date("2027-02-01T10:00:00Z"),
        scheduledEndAt: new Date("2027-02-01T12:00:00Z"),
      }),
    BookingConflictError,
  );
});

test("a non-overlapping booking confirms fine, and can be rescheduled into a free slot", async () => {
  const booking = await createBookingRequest(baseRequest("+44-test-8", hourlyServiceId));
  await confirmBooking(booking.id, {
    scheduledStartAt: new Date("2027-03-01T09:00:00Z"),
    scheduledEndAt: new Date("2027-03-01T11:00:00Z"),
  });

  const rescheduled = await rescheduleBooking(booking.id, {
    scheduledStartAt: new Date("2027-03-02T13:00:00Z"),
    scheduledEndAt: new Date("2027-03-02T15:00:00Z"),
  });
  assert.equal(rescheduled.status, "CONFIRMED");
  assert.equal(rescheduled.scheduledStartAt?.toISOString(), new Date("2027-03-02T13:00:00Z").toISOString());
});

test("returning customers (same phone) are reused rather than duplicated", async () => {
  const first = await createBookingRequest(baseRequest("+44-test-9", hourlyServiceId, { customer: { name: "Returning Customer", phone: "+44-test-9" } }));
  const second = await createBookingRequest(baseRequest("+44-test-9", hourlyServiceId, { customer: { name: "Returning Customer", phone: "+44-test-9" } }));
  assert.equal(first.customerId, second.customerId);
});
