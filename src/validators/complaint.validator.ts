import { z } from "zod";

// Docs/ADMIN_DASHBOARD_SPEC.md asks to "track complaint status" without
// specifying a status model, so this is a product decision made here: a
// simple, fixed set of statuses. It's a plain string column (not a Prisma
// enum), so adding a status later doesn't need a migration.
export const COMPLAINT_STATUSES = ["open", "investigating", "resolved", "closed"] as const;

export const createComplaintSchema = z.object({
  customerId: z.string().uuid().optional().or(z.literal("")),
  bookingId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().trim().min(1),
});

export const updateComplaintSchema = z.object({
  status: z.enum(COMPLAINT_STATUSES),
  adminNotes: z.string().trim().optional().or(z.literal("")),
});
