import type { Request, Response } from "express";
import { listBookingsScheduledBetween, listPendingRequests } from "../repositories/booking.repository";
import { buildMonthGrid, buildWeekDays } from "../utils/calendarGrid";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  parseDateParam,
  formatLocalDate,
} from "../utils/dateRange";

type BookingWithRelations = Awaited<ReturnType<typeof listBookingsScheduledBetween>>[number];

function getScheduledStart(booking: BookingWithRelations): Date {
  // listBookingsScheduledBetween only returns rows with scheduledStartAt set.
  return booking.scheduledStartAt as Date;
}

export async function showMonthView(req: Request, res: Response) {
  const date = parseDateParam(req.query.date);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const bookings = await listBookingsScheduledBetween(start, end);
  const weeks = buildMonthGrid(date, bookings, getScheduledStart);

  const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  res.render("admin/calendar-month", {
    date,
    weeks,
    prevDate: formatLocalDate(prevMonth),
    nextDate: formatLocalDate(nextMonth),
  });
}

export async function showWeekView(req: Request, res: Response) {
  const date = parseDateParam(req.query.date);
  const start = startOfWeek(date);
  const end = endOfWeek(date);
  const bookings = await listBookingsScheduledBetween(start, end);
  const days = buildWeekDays(start, bookings, getScheduledStart);

  const prevWeek = new Date(start);
  prevWeek.setDate(start.getDate() - 7);
  const nextWeek = new Date(start);
  nextWeek.setDate(start.getDate() + 7);

  res.render("admin/calendar-week", {
    date,
    days,
    prevDate: formatLocalDate(prevWeek),
    nextDate: formatLocalDate(nextWeek),
  });
}

export async function showDayView(req: Request, res: Response) {
  const date = parseDateParam(req.query.date);
  const start = startOfDay(date);
  const end = endOfDay(date);
  const [bookings, pendingRequests] = await Promise.all([
    listBookingsScheduledBetween(start, end),
    listPendingRequests(),
  ]);
  const sameDayPending = pendingRequests.filter((b) => {
    const d = startOfDay(b.requestedDate);
    return d.getTime() === start.getTime();
  });

  const prevDay = new Date(start);
  prevDay.setDate(start.getDate() - 1);
  const nextDay = new Date(start);
  nextDay.setDate(start.getDate() + 1);

  res.render("admin/calendar-day", {
    date: start,
    bookings: bookings.sort((a, b) => getScheduledStart(a).getTime() - getScheduledStart(b).getTime()),
    pendingRequests: sameDayPending,
    prevDate: formatLocalDate(prevDay),
    nextDate: formatLocalDate(nextDay),
  });
}
