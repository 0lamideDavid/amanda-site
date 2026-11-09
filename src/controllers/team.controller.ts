import type { Request, Response } from "express";
import { listTeam, inviteAdmin, AdminAlreadyExistsError } from "../services/adminInvite.service";
import { inviteAdminSchema } from "../validators/adminInvite.validator";

export async function listTeamPage(req: Request, res: Response) {
  const admins = await listTeam();
  res.render("admin/team-list", {
    admins,
    error: typeof req.query.error === "string" ? req.query.error : null,
    success: typeof req.query.success === "string" ? req.query.success : null,
  });
}

export async function handleInviteAdmin(req: Request, res: Response) {
  const parsed = inviteAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.redirect(`/admin/team?error=${encodeURIComponent("Enter a valid name and email.")}`);
  }

  try {
    await inviteAdmin(parsed.data.name, parsed.data.email);
    res.redirect(`/admin/team?success=${encodeURIComponent(`Invite sent to ${parsed.data.email}.`)}`);
  } catch (err) {
    if (err instanceof AdminAlreadyExistsError) {
      return res.redirect(`/admin/team?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }
}
