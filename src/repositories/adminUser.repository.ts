import { prisma } from "../config/prisma";
import type { Prisma } from "@prisma/client";

export function findAdminByEmail(email: string) {
  return prisma.adminUser.findUnique({ where: { email } });
}

export function findAdminByInviteToken(token: string) {
  return prisma.adminUser.findUnique({ where: { inviteToken: token } });
}

export function listAdmins() {
  return prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
}

export function createInvitedAdmin(data: Prisma.AdminUserCreateInput) {
  return prisma.adminUser.create({ data });
}

export function setAdminPassword(id: string, passwordHash: string) {
  return prisma.adminUser.update({
    where: { id },
    data: { passwordHash, inviteToken: null, inviteTokenExpiresAt: null },
  });
}

export function renewAdminInvite(id: string, data: { inviteToken: string; inviteTokenExpiresAt: Date }) {
  return prisma.adminUser.update({ where: { id }, data });
}
