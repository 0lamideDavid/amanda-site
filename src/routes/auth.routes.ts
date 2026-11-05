import { Router } from "express";
import { showLoginPage, handleLogin, handleLogout } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.get("/admin/login", showLoginPage);
authRouter.post("/admin/login", handleLogin);
authRouter.post("/admin/logout", handleLogout);
