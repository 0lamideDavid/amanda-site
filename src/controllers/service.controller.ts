import type { Request, Response } from "express";
import { listAllServices, findServiceById, createService, updateService } from "../repositories/service.repository";
import { serviceSchema } from "../validators/service.validator";

export async function listServicesPage(req: Request, res: Response) {
  const services = await listAllServices();
  res.render("admin/services-list", { services });
}

export function showNewServiceForm(req: Request, res: Response) {
  res.render("admin/service-form", { service: null, error: null });
}

export async function showEditServiceForm(req: Request, res: Response) {
  const service = await findServiceById(req.params.id);
  if (!service) return res.status(404).render("admin/booking-not-found");
  res.render("admin/service-form", { service, error: null });
}

function toValidatorInput(body: Record<string, unknown>) {
  return { ...body, active: body.active === "on" };
}

export async function handleCreateService(req: Request, res: Response) {
  const parsed = serviceSchema.safeParse(toValidatorInput(req.body));
  if (!parsed.success) {
    return res.status(400).render("admin/service-form", { service: req.body, error: "Check the service details and try again." });
  }
  const service = await createService(parsed.data);
  res.redirect(`/admin/services/${service.id}/edit`);
}

export async function handleUpdateService(req: Request, res: Response) {
  const parsed = serviceSchema.safeParse(toValidatorInput(req.body));
  if (!parsed.success) {
    return res
      .status(400)
      .render("admin/service-form", { service: { id: req.params.id, ...req.body }, error: "Check the service details and try again." });
  }
  await updateService(req.params.id, parsed.data);
  res.redirect("/admin/services");
}
