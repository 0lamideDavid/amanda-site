import { findCustomerByPhone, createCustomer, updateCustomer } from "../repositories/customer.repository";

// Customers don't have accounts (Docs/DATABASE_SCHEMA.md), so a returning
// customer is matched by phone number; their latest name/email overwrite
// what's on file.
export async function findOrCreateCustomer(input: { name: string; phone: string; email?: string }) {
  const existing = await findCustomerByPhone(input.phone);
  if (!existing) {
    return createCustomer({ name: input.name, phone: input.phone, email: input.email ?? null });
  }
  if (existing.name !== input.name || (input.email && existing.email !== input.email)) {
    return updateCustomer(existing.id, { name: input.name, email: input.email ?? existing.email });
  }
  return existing;
}
