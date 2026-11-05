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
