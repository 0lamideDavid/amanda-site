import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";
import { Prisma } from "@prisma/client";
import type { Booking, Customer, Service } from "@prisma/client";
import {
  sendBookingRequestReceivedEmail,
  sendBookingConfirmedEmail,
  sendBookingRescheduledEmail,
  sendBookingCancelledEmail,
  sendBookingCompletedEmail,
  sendNewBookingRequestAdminEmail,
} from "../src/services/email.service";

const customer: Customer = {
  id: "cust-1",
  name: "Jane Doe",
  phone: "+44 7700 900000",
  email: "jane@test.local",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const service: Service = {
  id: "svc-1",
  name: "Regular home cleaning",
  description: "Weekly cleaning",
  pricingUnit: "hourly",
  basePrice: new Prisma.Decimal("18.00"),
  minimum: new Prisma.Decimal("2"),
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const booking: Booking = {
  id: "booking-1",
  customerId: customer.id,
  serviceId: service.id,
  requestedDate: new Date("2027-01-10"),
  requestedTime: "Morning",
  scheduledStartAt: new Date("2027-01-10T09:00:00"),
  scheduledEndAt: new Date("2027-01-10T11:00:00"),
  status: "CONFIRMED",
  address: "1 Test Street",
  postcode: "PL1 1AA",
  instructions: "Side gate code 1234",
  frequency: "One-off",
  quantity: new Prisma.Decimal("2"),
  priceSnapshot: new Prisma.Decimal("36.00"),
  adminNotes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Every one of these should resolve without throwing even though no
// RESEND_API_KEY is configured in the test environment — a failed or
// unconfigured send must never break the booking operation that
// triggered it (see email.service.ts's sendNotificationEmail).
test("every notification function resolves without throwing when email is unconfigured", async () => {
  await assert.doesNotReject(() => sendBookingRequestReceivedEmail(customer, service, booking));
  await assert.doesNotReject(() => sendBookingConfirmedEmail(customer, service, booking));
  await assert.doesNotReject(() => sendBookingRescheduledEmail(customer, service, booking));
  await assert.doesNotReject(() => sendBookingCancelledEmail(customer, service, booking));
  await assert.doesNotReject(() => sendBookingCompletedEmail(customer, service, booking));
  await assert.doesNotReject(() => sendNewBookingRequestAdminEmail(customer, service, booking));
});

test("customer emails are skipped silently when the customer has no email on file", async () => {
  const noEmailCustomer: Customer = { ...customer, email: null };
  // customer.email is optional on the schema — this must not throw just
  // because there's nowhere to send it.
  await assert.doesNotReject(() => sendBookingConfirmedEmail(noEmailCustomer, service, booking));
});

test("the notification template renders real content for a representative booking", async () => {
  const templatePath = path.join(__dirname, "..", "src", "views", "emails", "notification.ejs");
  const html = await ejs.renderFile(templatePath, {
    title: "You're booked in",
    preheader: "Here's a summary of your confirmed appointment.",
    eyebrow: "Booking confirmed",
    introHtml: "Here's a summary of your confirmed appointment.",
    detailRows: [
      { label: "Service", value: service.name },
      { label: "Price", value: "£36.00" },
    ],
    outroHtml: "Thanks for booking with us.",
    ctaText: "Review in admin",
    ctaUrl: "http://localhost:3000/admin/bookings/booking-1",
    contact: { brand: "Amanda's", tagline: "Smart Cleaning, Swift Errand", area: "Plymouth, Devon", email: "hello@amandas.example", phone: "+44 7000 000000" },
  });

  assert.match(html as string, /You&#39;re booked in|You're booked in/);
  assert.match(html as string, /Regular home cleaning/);
  assert.match(html as string, /£36\.00/);
  assert.match(html as string, /Review in admin/);
  assert.match(html as string, /http:\/\/localhost:3000\/admin\/bookings\/booking-1/);
  // Table-based layout, not flexbox/grid — the structural requirement for
  // this to render correctly in Outlook and other email clients.
  assert.match(html as string, /<table/);
});
