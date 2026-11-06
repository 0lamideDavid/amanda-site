import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { asyncHandler } from "../utils/asyncHandler";
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

// Exposed to every admin view via res.locals, so _nav.ejs can highlight
// the current section without each controller having to pass it.
adminRouter.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

adminRouter.get("/", asyncHandler(showOverview));

adminRouter.get("/bookings", asyncHandler(listBookingsPage));
adminRouter.get("/bookings/:id", asyncHandler(showBookingDetail));
adminRouter.post("/bookings/:id/confirm", asyncHandler(handleConfirm));
adminRouter.post("/bookings/:id/reschedule", asyncHandler(handleReschedule));
adminRouter.post("/bookings/:id/cancel", asyncHandler(handleCancel));
adminRouter.post("/bookings/:id/start", asyncHandler(handleStart));
adminRouter.post("/bookings/:id/complete", asyncHandler(handleComplete));

adminRouter.get("/calendar", asyncHandler(showMonthView));
adminRouter.get("/calendar/month", asyncHandler(showMonthView));
adminRouter.get("/calendar/week", asyncHandler(showWeekView));
adminRouter.get("/calendar/day", asyncHandler(showDayView));

adminRouter.get("/services", asyncHandler(listServicesPage));
adminRouter.get("/services/new", asyncHandler(showNewServiceForm));
adminRouter.post("/services", asyncHandler(handleCreateService));
adminRouter.get("/services/:id/edit", asyncHandler(showEditServiceForm));
adminRouter.post("/services/:id", asyncHandler(handleUpdateService));

adminRouter.get("/customers", asyncHandler(listCustomersPage));
adminRouter.get("/customers/:id", asyncHandler(showCustomerDetail));
adminRouter.post("/customers/:id", asyncHandler(handleUpdateCustomer));

adminRouter.get("/complaints", asyncHandler(listComplaintsPage));
adminRouter.get("/complaints/new", asyncHandler(showNewComplaintForm));
adminRouter.post("/complaints", asyncHandler(handleCreateComplaint));
adminRouter.get("/complaints/:id", asyncHandler(showComplaintDetail));
adminRouter.post("/complaints/:id", asyncHandler(handleUpdateComplaint));
