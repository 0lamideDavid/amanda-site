import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { showOverview } from "../controllers/overview.controller";
import {
  listBookingsPage,
  showBookingDetail,
  handleConfirm,
  handleReschedule,
  handleCancel,
  handleStart,
  handleComplete,
} from "../controllers/booking.controller";
import { showMonthView, showWeekView, showDayView } from "../controllers/calendar.controller";

export const adminRouter = Router();

adminRouter.use(requireAdminAuth);

adminRouter.get("/", showOverview);

adminRouter.get("/bookings", listBookingsPage);
adminRouter.get("/bookings/:id", showBookingDetail);
adminRouter.post("/bookings/:id/confirm", handleConfirm);
adminRouter.post("/bookings/:id/reschedule", handleReschedule);
adminRouter.post("/bookings/:id/cancel", handleCancel);
adminRouter.post("/bookings/:id/start", handleStart);
adminRouter.post("/bookings/:id/complete", handleComplete);

adminRouter.get("/calendar", showMonthView);
adminRouter.get("/calendar/month", showMonthView);
adminRouter.get("/calendar/week", showWeekView);
adminRouter.get("/calendar/day", showDayView);
