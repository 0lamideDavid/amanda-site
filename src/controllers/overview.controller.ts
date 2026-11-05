import type { Request, Response } from "express";
import {
  countPendingRequests,
  countUpcomingConfirmed,
  listPendingRequests,
} from "../repositories/booking.repository";

export async function showOverview(req: Request, res: Response) {
  const [pendingCount, upcomingConfirmedCount, pendingRequests] = await Promise.all([
    countPendingRequests(),
    countUpcomingConfirmed(),
    listPendingRequests(),
  ]);
  res.render("admin/overview", { pendingCount, upcomingConfirmedCount, pendingRequests });
}
