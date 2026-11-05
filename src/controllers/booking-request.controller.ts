import type { Request, Response, NextFunction } from "express";
import { createBookingRequestSchema } from "../validators/booking.validator";
import { createBookingRequest } from "../services/booking.service";

// Public endpoint: a submitted request is never a confirmed appointment
// (Docs/BOOKING_SYSTEM_SPEC.md) — createBookingRequest always creates it as
// PENDING. No auth here; this is the one route unauthenticated visitors can
// write through.
export async function handleCreateBookingRequest(req: Request, res: Response, next: NextFunction) {
  const parsed = createBookingRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, errors: parsed.error.flatten() });
  }

  try {
    const booking = await createBookingRequest(parsed.data);
    res.status(201).json({ ok: true, bookingId: booking.id });
  } catch (err) {
    if (err instanceof Error && err.message === "Service not found or inactive.") {
      return res.status(400).json({ ok: false, errors: { formErrors: [err.message], fieldErrors: {} } });
    }
    next(err);
  }
}
