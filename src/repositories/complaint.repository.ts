import { prisma } from "../config/prisma";
import type { Prisma } from "@prisma/client";

export function listComplaints(status?: string) {
  return prisma.complaint.findMany({
    where: status ? { status } : undefined,
    include: { customer: true, booking: { include: { service: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function findComplaintById(id: string) {
  return prisma.complaint.findUnique({
    where: { id },
    include: { customer: true, booking: { include: { service: true } } },
  });
}

export function createComplaint(data: Prisma.ComplaintUncheckedCreateInput) {
  return prisma.complaint.create({ data });
}

export function updateComplaint(id: string, data: Prisma.ComplaintUpdateInput) {
  return prisma.complaint.update({ where: { id }, data });
}

export function countOpenComplaints() {
  return prisma.complaint.count({ where: { status: { in: ["open", "investigating"] } } });
}
