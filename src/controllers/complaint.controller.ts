import type { Request, Response } from "express";
import {
  listComplaints,
  findComplaintById,
  createComplaint,
  updateComplaint,
} from "../repositories/complaint.repository";
import { createComplaintSchema, updateComplaintSchema, COMPLAINT_STATUSES } from "../validators/complaint.validator";

export async function listComplaintsPage(req: Request, res: Response) {
  const status = typeof req.query.status === "string" && req.query.status ? req.query.status : undefined;
  const complaints = await listComplaints(status);
  res.render("admin/complaints-list", { complaints, statuses: COMPLAINT_STATUSES, filterStatus: status ?? "" });
}

export function showNewComplaintForm(req: Request, res: Response) {
  res.render("admin/complaint-form", {
    customerId: typeof req.query.customerId === "string" ? req.query.customerId : "",
    bookingId: typeof req.query.bookingId === "string" ? req.query.bookingId : "",
    error: null,
  });
}

export async function handleCreateComplaint(req: Request, res: Response) {
  const parsed = createComplaintSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).render("admin/complaint-form", {
      customerId: req.body.customerId ?? "",
      bookingId: req.body.bookingId ?? "",
      error: "Enter a description (and a valid customer/booking ID if provided).",
    });
  }
  const complaint = await createComplaint({
    description: parsed.data.description,
    customerId: parsed.data.customerId || null,
    bookingId: parsed.data.bookingId || null,
  });
  res.redirect(`/admin/complaints/${complaint.id}`);
}

export async function showComplaintDetail(req: Request, res: Response) {
  const complaint = await findComplaintById(req.params.id);
  if (!complaint) return res.status(404).render("admin/booking-not-found");
  res.render("admin/complaint-detail", { complaint, statuses: COMPLAINT_STATUSES, error: typeof req.query.error === "string" ? req.query.error : null });
}

export async function handleUpdateComplaint(req: Request, res: Response) {
  const parsed = updateComplaintSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.redirect(`/admin/complaints/${req.params.id}?error=${encodeURIComponent("Choose a valid status.")}`);
  }
  await updateComplaint(req.params.id, { status: parsed.data.status, adminNotes: parsed.data.adminNotes || null });
  res.redirect(`/admin/complaints/${req.params.id}`);
}
