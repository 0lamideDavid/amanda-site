import type { Request, Response, NextFunction } from "express";

// Guards admin routes server-side. Wired up once the authentication
// milestone is approved and implemented (see Docs/AUTHENTICATION_SPEC.md).
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.adminUserId) {
    return next();
  }
  return res.redirect("/admin/login");
}
