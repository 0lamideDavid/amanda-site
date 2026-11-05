import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Base prices/minimums as given in Docs/DATABASE_SCHEMA.md's "database-driven"
// requirement, using the figures already surfaced in the Phase 0 audit
// (Docs/REPO_AUDIT_AND_PLAN.md). These are starting values an admin can
// change later (Phase 5); nothing here is hardcoded into any UI.
const SERVICES = [
  {
    name: "Regular home cleaning",
    description: "Weekly or fortnightly kitchens, bathrooms, floors and dusting, tailored to a checklist.",
    pricingUnit: "hourly",
    basePrice: "18.00",
    minimum: "2",
  },
  {
    name: "Errands & concierge",
    description: "Shopping, prescriptions, post, returns, and waiting in for deliveries or tradespeople.",
    pricingUnit: "hourly",
    basePrice: "20.00",
    minimum: "1",
  },
  {
    name: "Holiday-let turnover",
    description: "Clean, change linen, restock and send a photo report, with key-holding if needed.",
    pricingUnit: "flat",
    basePrice: "55.00",
    minimum: null,
  },
  {
    name: "End-of-tenancy / deep clean",
    description: "Ovens, appliances, limescale, inside windows and steam-cleaned carpets, ready for inspection.",
    pricingUnit: "from",
    basePrice: "180.00",
    minimum: null,
  },
  {
    name: "Small commercial cleaning",
    description: "After-hours cleaning for offices, salons and practices on a regular contract.",
    pricingUnit: "quote",
    basePrice: null,
    minimum: null,
  },
] as const;

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env");
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.create({ data: { name: "Admin", email, passwordHash } });
  console.log(`Created admin user ${email}.`);
}

async function seedServices() {
  for (const service of SERVICES) {
    const existing = await prisma.service.findFirst({ where: { name: service.name } });
    if (existing) {
      console.log(`Service "${service.name}" already exists, skipping.`);
      continue;
    }
    await prisma.service.create({ data: service });
    console.log(`Created service "${service.name}".`);
  }
}

async function main() {
  await seedAdmin();
  await seedServices();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
