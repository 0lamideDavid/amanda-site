import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";

export const adminRouter = Router();

adminRouter.use(requireAdminAuth);

// Admin dashboard, bookings, calendar, services, customers, and complaints
// are later milestones (see Docs/ADMIN_DASHBOARD_SPEC.md). This placeholder
// exists only to prove route protection works end to end.
adminRouter.get("/", (req, res) => {
  res.render("admin/placeholder");
});
