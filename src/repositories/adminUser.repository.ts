import { prisma } from "../config/prisma";

export function findAdminByEmail(email: string) {
  return prisma.adminUser.findUnique({ where: { email } });
}

export function findAdminById(id: string) {
  return prisma.adminUser.findUnique({ where: { id } });
}
