import type { Request, Response } from "express";
import { listCustomers, findCustomerById, updateCustomer } from "../repositories/customer.repository";
import { updateCustomerSchema } from "../validators/customer.validator";

export async function listCustomersPage(req: Request, res: Response) {
  const customers = await listCustomers();
  res.render("admin/customers-list", { customers });
}

export async function showCustomerDetail(req: Request, res: Response) {
  const customer = await findCustomerById(req.params.id);
  if (!customer) return res.status(404).render("admin/booking-not-found");
  res.render("admin/customer-detail", { customer, error: typeof req.query.error === "string" ? req.query.error : null });
}

export async function handleUpdateCustomer(req: Request, res: Response) {
  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.redirect(`/admin/customers/${req.params.id}?error=${encodeURIComponent("Enter a valid name, phone, and email.")}`);
  }
  await updateCustomer(req.params.id, {
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
  });
  res.redirect(`/admin/customers/${req.params.id}`);
}
