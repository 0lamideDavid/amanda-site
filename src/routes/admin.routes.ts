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
import {
  listServicesPage,
  showNewServiceForm,
  showEditServiceForm,
  handleCreateService,
  handleUpdateService,
} from "../controllers/service.controller";
import { listCustomersPage, showCustomerDetail, handleUpdateCustomer } from "../controllers/customer.controller";
import {
  listComplaintsPage,
  showNewComplaintForm,
  handleCreateComplaint,
  showComplaintDetail,
  handleUpdateComplaint,
} from "../controllers/complaint.controller";

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

adminRouter.get("/services", listServicesPage);
adminRouter.get("/services/new", showNewServiceForm);
adminRouter.post("/services", handleCreateService);
adminRouter.get("/services/:id/edit", showEditServiceForm);
adminRouter.post("/services/:id", handleUpdateService);

adminRouter.get("/customers", listCustomersPage);
adminRouter.get("/customers/:id", showCustomerDetail);
adminRouter.post("/customers/:id", handleUpdateCustomer);

adminRouter.get("/complaints", listComplaintsPage);
adminRouter.get("/complaints/new", showNewComplaintForm);
adminRouter.post("/complaints", handleCreateComplaint);
adminRouter.get("/complaints/:id", showComplaintDetail);
adminRouter.post("/complaints/:id", handleUpdateComplaint);
