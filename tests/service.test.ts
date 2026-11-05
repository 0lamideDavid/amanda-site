import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/config/prisma";
import { findActiveServices } from "../src/repositories/service.repository";

before(async () => {
  await prisma.service.deleteMany({ where: { name: "Test-only service" } });
  await prisma.service.create({
    data: {
      name: "Test-only service",
      description: "Created by tests/service.test.ts",
      pricingUnit: "hourly",
      basePrice: "25.00",
      minimum: "1",
      active: true,
    },
  });
});

after(async () => {
  await prisma.service.deleteMany({ where: { name: "Test-only service" } });
  await prisma.$disconnect();
});

test("findActiveServices returns only active services", async () => {
  const inactive = await prisma.service.create({
    data: {
      name: "Test-only inactive service",
      description: "Created by tests/service.test.ts",
      pricingUnit: "hourly",
      basePrice: "25.00",
      active: false,
    },
  });

  const services = await findActiveServices();
  assert.ok(services.some((s) => s.name === "Test-only service"));
  assert.ok(!services.some((s) => s.id === inactive.id));

  await prisma.service.delete({ where: { id: inactive.id } });
});
