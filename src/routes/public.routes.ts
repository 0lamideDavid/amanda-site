import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { bookingRequestLimiter } from "../middleware/rateLimiter";
import { showHome } from "../controllers/public.controller";
import { handleCreateBookingRequest } from "../controllers/booking-request.controller";

export const publicRouter = Router();

publicRouter.get("/", asyncHandler(showHome));
publicRouter.post("/booking-requests", bookingRequestLimiter, asyncHandler(handleCreateBookingRequest));
