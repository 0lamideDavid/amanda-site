import { prisma } from "../config/prisma";

export function findAdminByEmail(email: string) {
  return prisma.adminUser.findUnique({ where: { email } });
}
