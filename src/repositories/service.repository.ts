import { prisma } from "../config/prisma";

export function findActiveServices() {
  return prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } });
}

export function findServiceById(id: string) {
  return prisma.service.findUnique({ where: { id } });
}
