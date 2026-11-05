import { prisma } from "../config/prisma";
import type { Prisma } from "@prisma/client";

export function findActiveServices() {
  return prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } });
}

export function findServiceById(id: string) {
  return prisma.service.findUnique({ where: { id } });
}

export function listAllServices() {
  return prisma.service.findMany({ orderBy: { name: "asc" } });
}

export function createService(data: Prisma.ServiceCreateInput) {
  return prisma.service.create({ data });
}

// Deliberately only touches the Service row. Existing bookings keep the
// priceSnapshot they were created with, so changing a price here never
// rewrites historical totals (Docs/DATABASE_SCHEMA.md).
export function updateService(id: string, data: Prisma.ServiceUpdateInput) {
  return prisma.service.update({ where: { id }, data });
}
