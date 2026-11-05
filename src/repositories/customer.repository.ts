import { prisma } from "../config/prisma";

export function findCustomerByPhone(phone: string) {
  return prisma.customer.findFirst({ where: { phone } });
}

export function createCustomer(data: { name: string; phone: string; email?: string | null }) {
  return prisma.customer.create({ data });
}

export function updateCustomer(id: string, data: { name?: string; email?: string | null }) {
  return prisma.customer.update({ where: { id }, data });
}
