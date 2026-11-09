import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  findAdminByEmail,
  findAdminByInviteToken,
  listAdmins,
  createInvitedAdmin,
  setAdminPassword,
  renewAdminInvite,
} from "../repositories/adminUser.repository";
import { sendAdminInviteEmail } from "./email.service";
import { env } from "../config/env";

const INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export class AdminAlreadyExistsError extends Error {
  constructor() {
    super("This email already has an active admin account.");
    this.name = "AdminAlreadyExistsError";
  }
}

export class InvalidInviteError extends Error {
  constructor(message = "This invite link is invalid or has expired.") {
    super(message);
    this.name = "InvalidInviteError";
  }
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function listTeam() {
  return listAdmins();
}

export async function inviteAdmin(name: string, email: string) {
  const existing = await findAdminByEmail(email);
  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  let admin;
  if (existing && !existing.inviteToken) {
    // Already accepted their invite — a real, active admin already.
    throw new AdminAlreadyExistsError();
  } else if (existing) {
    // Invited but not yet accepted — resend with a fresh token.
    admin = await renewAdminInvite(existing.id, { inviteToken: token, inviteTokenExpiresAt: expiresAt });
  } else {
    admin = await createInvitedAdmin({
      name,
      email,
      // Never-guessable sentinel, not a real password — see the schema
      // comment on AdminUser.passwordHash.
      passwordHash: await bcrypt.hash(generateToken(), 10),
      inviteToken: token,
      inviteTokenExpiresAt: expiresAt,
    });
  }

  const inviteUrl = `${env.APP_BASE_URL}/admin/accept-invite?token=${token}`;
  await sendAdminInviteEmail(admin.email, admin.name, inviteUrl);
  return admin;
}

async function requireValidInvite(token: string) {
  const admin = await findAdminByInviteToken(token);
  if (!admin) throw new InvalidInviteError();
  if (!admin.inviteTokenExpiresAt || admin.inviteTokenExpiresAt.getTime() < Date.now()) {
    throw new InvalidInviteError("This invite link has expired. Ask another admin to send a new one.");
  }
  return admin;
}

export const validateInviteToken = requireValidInvite;

export async function acceptInvite(token: string, password: string) {
  const admin = await requireValidInvite(token);
  const passwordHash = await bcrypt.hash(password, 12);
  return setAdminPassword(admin.id, passwordHash);
}
