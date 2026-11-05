import { prisma } from "../config/prisma";

export function findCustomerByPhone(phone: string) {
  return prisma.customer.findFirst({ where: { phone } });
}

export function createCustomer(data: { name: string; phone: string; email?: string | null }) {
  return prisma.customer.create({ data });
}

export function updateCustomer(id: string, data: { name?: string; phone?: string; email?: string | null }) {
  return prisma.customer.update({ where: { id }, data });
}

export function listCustomers() {
  return prisma.customer.findMany({ orderBy: { name: "asc" } });
}

export function findCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      bookings: { include: { service: true }, orderBy: { requestedDate: "desc" } },
      complaints: { orderBy: { createdAt: "desc" } },
    },
  });
}
