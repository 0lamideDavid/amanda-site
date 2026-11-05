import { Router } from "express";
import { showLoginPage, handleLogin, handleLogout } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const authRouter = Router();

authRouter.get("/admin/login", asyncHandler(showLoginPage));
authRouter.post("/admin/login", asyncHandler(handleLogin));
authRouter.post("/admin/logout", asyncHandler(handleLogout));
