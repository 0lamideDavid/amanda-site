import type { Request, Response } from "express";
import {
  countPendingRequests,
  countUpcomingConfirmed,
  listPendingRequests,
} from "../repositories/booking.repository";
import { countOpenComplaints } from "../repositories/complaint.repository";

export async function showOverview(req: Request, res: Response) {
  const [pendingCount, upcomingConfirmedCount, pendingRequests, openComplaintsCount] = await Promise.all([
    countPendingRequests(),
    countUpcomingConfirmed(),
    listPendingRequests(),
    countOpenComplaints(),
  ]);
  res.render("admin/overview", { pendingCount, upcomingConfirmedCount, pendingRequests, openComplaintsCount });
}
