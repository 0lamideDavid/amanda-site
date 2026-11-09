import { Prisma, type BookingStatus } from "@prisma/client";
import {
  createBooking,
  findBookingById,
  findOverlappingBookings,
  updateBooking,
} from "../repositories/booking.repository";
import { findServiceById } from "../repositories/service.repository";
import { findOrCreateCustomer } from "./customer.service";
import { computePriceSnapshot } from "./pricing.service";
import { BookingConflictError, InvalidBookingTransitionError } from "./booking.errors";
import type { CreateBookingRequestInput } from "../validators/booking.validator";
import {
  sendBookingRequestReceivedEmail,
  sendNewBookingRequestAdminEmail,
  sendBookingConfirmedEmail,
  sendBookingRescheduledEmail,
  sendBookingCancelledEmail,
  sendBookingCompletedEmail,
} from "./email.service";

type BookingWithRelations = NonNullable<Awaited<ReturnType<typeof findBookingById>>>;

// A submitted request is never a confirmed appointment (Docs/BOOKING_SYSTEM_SPEC.md).
// RESCHEDULE_REQUESTED is reachable only by rescheduling an already-confirmed
// booking; there's no separate "awaiting confirmation" step, since the spec
// marks that status as optional ("if used").
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  RESCHEDULE_REQUESTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["RESCHEDULE_REQUESTED", "IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

function assertTransition(current: BookingStatus, next: BookingStatus) {
  if (!ALLOWED_TRANSITIONS[current].includes(next)) {
    throw new InvalidBookingTransitionError(`Cannot move a ${current} booking to ${next}.`);
  }
}

async function requireBooking(bookingId: string): Promise<BookingWithRelations> {
  const booking = await findBookingById(bookingId);
  if (!booking) throw new Error(`Booking ${bookingId} not found.`);
  return booking;
}

async function assertNoConflict(start: Date, end: Date, excludeBookingId: string) {
  const overlaps = await findOverlappingBookings(start, end, excludeBookingId);
  if (overlaps.length > 0) throw new BookingConflictError();
}

export async function createBookingRequest(input: CreateBookingRequestInput) {
  const service = await findServiceById(input.serviceId);
  if (!service || !service.active) {
    throw new Error("Service not found or inactive.");
  }

  const customer = await findOrCreateCustomer(input.customer);
  const priceSnapshot = computePriceSnapshot(service, input.quantity);

  const booking = await createBooking({
    customerId: customer.id,
    serviceId: service.id,
    requestedDate: input.requestedDate,
    requestedTime: input.requestedTime,
    frequency: input.frequency ?? null,
    quantity: input.quantity != null ? new Prisma.Decimal(input.quantity) : null,
    address: input.address,
    postcode: input.postcode,
    instructions: input.instructions ?? null,
    priceSnapshot,
    status: "PENDING",
  });

  // Best-effort: email failures never block the booking itself (see
  // email.service.ts's sendNotificationEmail).
  await Promise.all([
    sendBookingRequestReceivedEmail(customer, service, booking),
    sendNewBookingRequestAdminEmail(customer, service, booking),
  ]);

  return booking;
}

export async function confirmBooking(
  bookingId: string,
  input: { scheduledStartAt: Date; scheduledEndAt: Date; priceSnapshot?: number },
) {
  const booking = await requireBooking(bookingId);
  assertTransition(booking.status, "CONFIRMED");
  await assertNoConflict(input.scheduledStartAt, input.scheduledEndAt, bookingId);

  const updated = await updateBooking(bookingId, {
    status: "CONFIRMED",
    scheduledStartAt: input.scheduledStartAt,
    scheduledEndAt: input.scheduledEndAt,
    priceSnapshot: input.priceSnapshot != null ? new Prisma.Decimal(input.priceSnapshot) : undefined,
  });

  await sendBookingConfirmedEmail(booking.customer, booking.service, updated);
  return updated;
}

export async function rescheduleBooking(
  bookingId: string,
  input: { scheduledStartAt: Date; scheduledEndAt: Date },
) {
  const booking = await requireBooking(bookingId);
  if (booking.status !== "CONFIRMED" && booking.status !== "RESCHEDULE_REQUESTED") {
    throw new InvalidBookingTransitionError(`Cannot reschedule a ${booking.status} booking.`);
  }
  await assertNoConflict(input.scheduledStartAt, input.scheduledEndAt, bookingId);

  const updated = await updateBooking(bookingId, {
    status: "CONFIRMED",
    scheduledStartAt: input.scheduledStartAt,
    scheduledEndAt: input.scheduledEndAt,
  });

  await sendBookingRescheduledEmail(booking.customer, booking.service, updated);
  return updated;
}

export async function cancelBooking(bookingId: string, adminNotes?: string) {
  const booking = await requireBooking(bookingId);
  assertTransition(booking.status, "CANCELLED");
  const updated = await updateBooking(bookingId, {
    status: "CANCELLED",
    adminNotes: adminNotes ?? booking.adminNotes,
  });

  await sendBookingCancelledEmail(booking.customer, booking.service, updated);
  return updated;
}

export async function startBooking(bookingId: string) {
  const booking = await requireBooking(bookingId);
  assertTransition(booking.status, "IN_PROGRESS");
  return updateBooking(bookingId, { status: "IN_PROGRESS" });
}

export async function completeBooking(bookingId: string) {
  const booking = await requireBooking(bookingId);
  assertTransition(booking.status, "COMPLETED");
  const updated = await updateBooking(bookingId, { status: "COMPLETED" });

  await sendBookingCompletedEmail(booking.customer, booking.service, updated);
  return updated;
}
