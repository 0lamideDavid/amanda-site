import type { Request, Response, NextFunction } from "express";
import type { BookingStatus } from "@prisma/client";
import { listBookings, findBookingById } from "../repositories/booking.repository";
import {
  confirmBooking,
  rescheduleBooking,
  cancelBooking,
  startBooking,
  completeBooking,
} from "../services/booking.service";
import { BookingConflictError, InvalidBookingTransitionError } from "../services/booking.errors";
import {
  confirmBookingSchema,
  rescheduleBookingSchema,
  cancelBookingSchema,
} from "../validators/booking.validator";

const VALID_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

function parseStatusFilter(value: unknown): BookingStatus | undefined {
  return typeof value === "string" && VALID_STATUSES.includes(value as BookingStatus)
    ? (value as BookingStatus)
    : undefined;
}

export async function listBookingsPage(req: Request, res: Response) {
  const status = parseStatusFilter(req.query.status);
  const from = typeof req.query.from === "string" && req.query.from ? new Date(req.query.from) : undefined;
  const to = typeof req.query.to === "string" && req.query.to ? new Date(req.query.to) : undefined;

  const bookings = await listBookings({ status, from, to });
  res.render("admin/bookings-list", {
    bookings,
    statuses: VALID_STATUSES,
    filters: {
      status: req.query.status ?? "",
      from: req.query.from ?? "",
      to: req.query.to ?? "",
    },
  });
}

export async function showBookingDetail(req: Request, res: Response) {
  const booking = await findBookingById(req.params.id);
  if (!booking) {
    return res.status(404).render("admin/booking-not-found");
  }
  res.render("admin/booking-detail", { booking, error: typeof req.query.error === "string" ? req.query.error : null });
}

function redirectWithError(res: Response, id: string, message: string) {
  res.redirect(`/admin/bookings/${id}?error=${encodeURIComponent(message)}`);
}

export async function handleConfirm(req: Request, res: Response, next: NextFunction) {
  const parsed = confirmBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return redirectWithError(res, req.params.id, "Enter a valid scheduled start and end time.");
  }
  try {
    await confirmBooking(req.params.id, parsed.data);
    res.redirect(`/admin/bookings/${req.params.id}`);
  } catch (err) {
    if (err instanceof BookingConflictError || err instanceof InvalidBookingTransitionError) {
      return redirectWithError(res, req.params.id, err.message);
    }
    next(err);
  }
}

export async function handleReschedule(req: Request, res: Response, next: NextFunction) {
  const parsed = rescheduleBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return redirectWithError(res, req.params.id, "Enter a valid scheduled start and end time.");
  }
  try {
    await rescheduleBooking(req.params.id, parsed.data);
    res.redirect(`/admin/bookings/${req.params.id}`);
  } catch (err) {
    if (err instanceof BookingConflictError || err instanceof InvalidBookingTransitionError) {
      return redirectWithError(res, req.params.id, err.message);
    }
    next(err);
  }
}

export async function handleCancel(req: Request, res: Response, next: NextFunction) {
  const parsed = cancelBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return redirectWithError(res, req.params.id, "Could not read the cancellation note.");
  }
  try {
    await cancelBooking(req.params.id, parsed.data.adminNotes);
    res.redirect(`/admin/bookings/${req.params.id}`);
  } catch (err) {
    if (err instanceof InvalidBookingTransitionError) {
      return redirectWithError(res, req.params.id, err.message);
    }
    next(err);
  }
}

export async function handleStart(req: Request, res: Response, next: NextFunction) {
  try {
    await startBooking(req.params.id);
    res.redirect(`/admin/bookings/${req.params.id}`);
  } catch (err) {
    if (err instanceof InvalidBookingTransitionError) {
      return redirectWithError(res, req.params.id, err.message);
    }
    next(err);
  }
}

export async function handleComplete(req: Request, res: Response, next: NextFunction) {
  try {
    await completeBooking(req.params.id);
    res.redirect(`/admin/bookings/${req.params.id}`);
  } catch (err) {
    if (err instanceof InvalidBookingTransitionError) {
      return redirectWithError(res, req.params.id, err.message);
    }
    next(err);
  }
}
