import type { Request, Response, NextFunction } from "express";
import { validateInviteToken, acceptInvite, InvalidInviteError } from "../services/adminInvite.service";
import { acceptInviteSchema } from "../validators/adminInvite.validator";

export async function showAcceptInvitePage(req: Request, res: Response) {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  try {
    const admin = await validateInviteToken(token);
    res.render("auth/accept-invite", { admin, token, error: null });
  } catch (err) {
    if (err instanceof InvalidInviteError) {
      return res.render("auth/invite-invalid", { message: err.message });
    }
    throw err;
  }
}

export async function handleAcceptInvite(req: Request, res: Response, next: NextFunction) {
  const token = typeof req.body.token === "string" ? req.body.token : "";

  let admin;
  try {
    admin = await validateInviteToken(token);
  } catch (err) {
    if (err instanceof InvalidInviteError) {
      return res.render("auth/invite-invalid", { message: err.message });
    }
    throw err;
  }

  const parsed = acceptInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).render("auth/accept-invite", {
      admin,
      token,
      error: parsed.error.issues[0]?.message ?? "Check your password and try again.",
    });
  }

  await acceptInvite(token, parsed.data.password);

  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.adminUserId = admin.id;
    req.session.save((saveErr) => {
      if (saveErr) return next(saveErr);
      res.redirect("/admin");
    });
  });
}
