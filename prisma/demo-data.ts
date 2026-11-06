import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dev-only sample data so the admin dashboard can be reviewed populated,
// not real customers/bookings. Deliberately separate from seed.ts, which
// only ever creates production-safe data (the admin account, the real
// Service catalogue). Re-runnable: clears anything in its own phone range
// first, so it never accumulates duplicates.
const DEMO_PHONE_PREFIX = "+44 7700 9001";

function daysFromNow(days: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const existingCustomers = await prisma.customer.findMany({
    where: { phone: { startsWith: DEMO_PHONE_PREFIX } },
    select: { id: true },
  });
  const existingIds = existingCustomers.map((c) => c.id);
  if (existingIds.length) {
    await prisma.complaint.deleteMany({ where: { customerId: { in: existingIds } } });
    await prisma.booking.deleteMany({ where: { customerId: { in: existingIds } } });
    await prisma.customer.deleteMany({ where: { id: { in: existingIds } } });
    console.log(`Cleared ${existingIds.length} existing demo customer(s) and their records.`);
  }

  const services = await prisma.service.findMany();
  const byName = (name: string) => {
    const s = services.find((s) => s.name === name);
    if (!s) throw new Error(`Service "${name}" not found — run npm run db:seed first.`);
    return s;
  };
  const regular = byName("Regular home cleaning");
  const errands = byName("Errands & concierge");
  const turnover = byName("Holiday-let turnover");
  const deepClean = byName("End-of-tenancy / deep clean");
  const commercial = byName("Small commercial cleaning");

  async function customer(name: string, phoneSuffix: string, email: string) {
    return prisma.customer.create({
      data: { name, phone: `${DEMO_PHONE_PREFIX}${phoneSuffix}`, email },
    });
  }

  const emma = await customer("Emma Clarke", "01", "emma.clarke@example.com");
  const james = await customer("James Holloway", "02", "james.holloway@example.com");
  const olivia = await customer("Olivia Bennett", "03", "olivia.bennett@example.com");
  const thomas = await customer("Thomas Reid", "04", "thomas.reid@example.com");
  const grace = await customer("Grace Fletcher", "05", "grace.fletcher@example.com");
  const michael = await customer("Michael Osei", "06", "michael.osei@example.com");
  const chloe = await customer("Chloe Dawson", "07", "chloe.dawson@example.com");

  const pending1 = await prisma.booking.create({
    data: {
      customerId: emma.id,
      serviceId: regular.id,
      requestedDate: daysFromNow(3, 0),
      requestedTime: "Morning (8am to 12pm)",
      frequency: "Weekly",
      quantity: "2",
      address: "14 Mutley Plain",
      postcode: "PL4 6JR",
      instructions: "Side gate code is 4521. Dog is friendly.",
      status: "PENDING",
      priceSnapshot: "36.00",
    },
  });

  await prisma.booking.create({
    data: {
      customerId: james.id,
      serviceId: errands.id,
      requestedDate: daysFromNow(2, 0),
      requestedTime: "Afternoon (12pm to 4pm)",
      frequency: "One-off",
      quantity: "1",
      address: "27 Hoe Road",
      postcode: "PL1 2AB",
      instructions: "Prescription collection from Boots, then post office.",
      status: "PENDING",
      priceSnapshot: "20.00",
    },
  });

  await prisma.booking.create({
    data: {
      customerId: olivia.id,
      serviceId: turnover.id,
      requestedDate: daysFromNow(5, 0),
      requestedTime: "Flexible",
      frequency: "One-off",
      quantity: "1",
      address: "Flat 3, The Moorings, Barbican",
      postcode: "PL1 2LR",
      instructions: "Key safe code 7781. Changeover between 11am guest checkout and 3pm check-in.",
      status: "PENDING",
      priceSnapshot: "55.00",
    },
  });

  const confirmed1Start = daysFromNow(1, 9);
  await prisma.booking.create({
    data: {
      customerId: thomas.id,
      serviceId: regular.id,
      requestedDate: daysFromNow(1, 0),
      requestedTime: "Morning (8am to 12pm)",
      frequency: "Fortnightly",
      quantity: "3",
      address: "9 Houndiscombe Road",
      postcode: "PL4 6HQ",
      status: "CONFIRMED",
      scheduledStartAt: confirmed1Start,
      scheduledEndAt: daysFromNow(1, 12),
      priceSnapshot: "54.00",
      adminNotes: "Regular fortnightly slot.",
    },
  });

  await prisma.booking.create({
    data: {
      customerId: grace.id,
      serviceId: deepClean.id,
      requestedDate: daysFromNow(4, 0),
      requestedTime: "Morning (8am to 12pm)",
      frequency: "One-off",
      address: "41 Lipson Road",
      postcode: "PL4 8JX",
      instructions: "End-of-tenancy, keys with letting agent.",
      status: "CONFIRMED",
      scheduledStartAt: daysFromNow(4, 9),
      scheduledEndAt: daysFromNow(4, 14),
      priceSnapshot: "210.00",
    },
  });

  await prisma.booking.create({
    data: {
      customerId: michael.id,
      serviceId: errands.id,
      requestedDate: daysFromNow(2, 0),
      requestedTime: "Evening (4pm to 7pm)",
      frequency: "One-off",
      quantity: "2",
      address: "5 North Hill",
      postcode: "PL4 8EY",
      instructions: "Waiting in for a furniture delivery.",
      status: "CONFIRMED",
      scheduledStartAt: daysFromNow(2, 16),
      scheduledEndAt: daysFromNow(2, 18),
      priceSnapshot: "40.00",
    },
  });

  await prisma.booking.create({
    data: {
      customerId: chloe.id,
      serviceId: regular.id,
      requestedDate: daysFromNow(0, 0),
      requestedTime: "Morning (8am to 12pm)",
      frequency: "Weekly",
      quantity: "2",
      address: "63 Beaumont Road",
      postcode: "PL4 9BL",
      status: "IN_PROGRESS",
      scheduledStartAt: daysFromNow(0, 9),
      scheduledEndAt: daysFromNow(0, 11),
      priceSnapshot: "36.00",
    },
  });

  const completed1 = await prisma.booking.create({
    data: {
      customerId: emma.id,
      serviceId: regular.id,
      requestedDate: daysFromNow(-6, 0),
      requestedTime: "Morning (8am to 12pm)",
      frequency: "Weekly",
      quantity: "2",
      address: "14 Mutley Plain",
      postcode: "PL4 6JR",
      status: "COMPLETED",
      scheduledStartAt: daysFromNow(-6, 9),
      scheduledEndAt: daysFromNow(-6, 11),
      priceSnapshot: "36.00",
    },
  });

  await prisma.booking.create({
    data: {
      customerId: james.id,
      serviceId: turnover.id,
      requestedDate: daysFromNow(-3, 0),
      requestedTime: "Flexible",
      frequency: "One-off",
      quantity: "1",
      address: "18 Royal Parade",
      postcode: "PL1 1EA",
      status: "COMPLETED",
      scheduledStartAt: daysFromNow(-3, 11),
      scheduledEndAt: daysFromNow(-3, 13),
      priceSnapshot: "55.00",
    },
  });

  await prisma.booking.create({
    data: {
      customerId: olivia.id,
      serviceId: commercial.id,
      requestedDate: daysFromNow(-2, 0),
      requestedTime: "Evening (4pm to 7pm)",
      frequency: "Weekly",
      address: "Unit 4, Faraday Mill Business Park",
      postcode: "PL4 0ST",
      status: "CANCELLED",
      adminNotes: "Customer cancelled — found an in-house cleaner.",
      priceSnapshot: "0.00",
    },
  });

  await prisma.complaint.create({
    data: {
      customerId: emma.id,
      bookingId: completed1.id,
      description: "Missed a spot under the kitchen sink.",
      status: "resolved",
      adminNotes: "Re-cleaned free of charge on the next visit.",
    },
  });

  await prisma.complaint.create({
    data: {
      customerId: grace.id,
      description: "Arrived later than the agreed time window.",
      status: "investigating",
    },
  });

  await prisma.complaint.create({
    data: {
      customerId: pending1.customerId,
      description: "Called about rescheduling but no answer for over a day.",
      status: "open",
    },
  });

  console.log("Created 7 demo customers, 10 demo bookings, and 3 demo complaints.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
