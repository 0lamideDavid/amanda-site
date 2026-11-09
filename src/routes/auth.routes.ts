import { Router } from "express";
import { showLoginPage, handleLogin, handleLogout } from "../controllers/auth.controller";
import { showAcceptInvitePage, handleAcceptInvite } from "../controllers/acceptInvite.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const authRouter = Router();

authRouter.get("/admin/login", asyncHandler(showLoginPage));
authRouter.post("/admin/login", asyncHandler(handleLogin));
authRouter.post("/admin/logout", asyncHandler(handleLogout));

// Public (unauthenticated), same as login — this is how someone becomes an
// admin in the first place.
authRouter.get("/admin/accept-invite", asyncHandler(showAcceptInvitePage));
authRouter.post("/admin/accept-invite", asyncHandler(handleAcceptInvite));
