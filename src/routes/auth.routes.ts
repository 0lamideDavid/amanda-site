import { Router } from "express";

export const authRouter = Router();

// Login/logout handlers are implemented in the authentication milestone
// once the approach in Docs/AUTHENTICATION_SPEC.md is approved.
authRouter.get("/admin/login", (req, res) => {
  res.render("auth/login");
});
