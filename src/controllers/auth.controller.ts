import type { Request, Response, NextFunction } from "express";
import { loginSchema } from "../validators/auth.validator";
import { verifyAdminCredentials } from "../services/auth.service";

export function showLoginPage(req: Request, res: Response) {
  res.render("auth/login", { error: null });
}

export async function handleLogin(req: Request, res: Response, next: NextFunction) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).render("auth/login", { error: "Enter a valid email and password." });
  }

  const { email, password } = parsed.data;
  const admin = await verifyAdminCredentials(email, password);
  if (!admin) {
    // Deliberately generic: never reveal whether the email matched an account.
    return res.status(401).render("auth/login", { error: "Invalid email or password." });
  }

  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.adminUserId = admin.id;
    req.session.save((saveErr) => {
      if (saveErr) return next(saveErr);
      res.redirect("/admin");
    });
  });
}

export function handleLogout(req: Request, res: Response, next: NextFunction) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.redirect("/admin/login");
  });
}
