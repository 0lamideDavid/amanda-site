import { prisma } from "../config/prisma";
import type { Prisma, BookingStatus } from "@prisma/client";

export function createBooking(data: Prisma.BookingUncheckedCreateInput) {
  return prisma.booking.create({ data });
}

export function findBookingById(id: string) {
  return prisma.booking.findUnique({ where: { id }, include: { customer: true, service: true } });
}

export function updateBooking(id: string, data: Prisma.BookingUpdateInput) {
  return prisma.booking.update({ where: { id }, data });
}

// Single-provider assumption (see Docs/REPO_AUDIT_AND_PLAN.md): any two
// CONFIRMED/IN_PROGRESS bookings with overlapping scheduled windows are
// treated as a conflict, regardless of staff, because no staff/working-hours
// model is defined yet.
const ACTIVE_STATUSES: BookingStatus[] = ["CONFIRMED", "IN_PROGRESS"];

export function findOverlappingBookings(start: Date, end: Date, excludeBookingId?: string) {
  return prisma.booking.findMany({
    where: {
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status: { in: ACTIVE_STATUSES },
      scheduledStartAt: { lt: end },
      scheduledEndAt: { gt: start },
    },
  });
}

const PENDING_STATUSES: BookingStatus[] = ["PENDING", "RESCHEDULE_REQUESTED"];

export function listBookings(filter: { status?: BookingStatus; from?: Date; to?: Date }) {
  return prisma.booking.findMany({
    where: {
      status: filter.status,
      ...(filter.from && filter.to
        ? {
            OR: [
              { requestedDate: { gte: filter.from, lt: filter.to } },
              { scheduledStartAt: { gte: filter.from, lt: filter.to } },
            ],
          }
        : {}),
    },
    include: { customer: true, service: true },
    orderBy: [{ requestedDate: "desc" }],
  });
}

// Scheduled-time based, so a PENDING request (no scheduledStartAt yet) can
// never appear here — it is structurally impossible for a pending request
// to be mistaken for a confirmed calendar slot.
export function listBookingsScheduledBetween(start: Date, end: Date) {
  return prisma.booking.findMany({
    where: { scheduledStartAt: { gte: start, lt: end } },
    include: { customer: true, service: true },
    orderBy: [{ scheduledStartAt: "asc" }],
  });
}

export function listPendingRequests() {
  return prisma.booking.findMany({
    where: { status: { in: PENDING_STATUSES } },
    include: { customer: true, service: true },
    orderBy: [{ requestedDate: "asc" }],
  });
}

export function countPendingRequests() {
  return prisma.booking.count({ where: { status: { in: PENDING_STATUSES } } });
}

export function countUpcomingConfirmed() {
  return prisma.booking.count({ where: { status: "CONFIRMED", scheduledStartAt: { gte: new Date() } } });
}
