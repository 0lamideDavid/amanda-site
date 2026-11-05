import bcrypt from "bcryptjs";
import { findAdminByEmail } from "../repositories/adminUser.repository";

// Bcrypt hash of an arbitrary fixed string (not a real credential). Used so
// a login attempt against an email that doesn't exist takes the same time
// as one against a real account, instead of short-circuiting and leaking
// via timing whether the account exists.
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeuE3qBgFJuNWJcwJk7aT0hvB.QAZl4R0i";

export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await findAdminByEmail(email);
  const hash = admin?.passwordHash ?? DUMMY_HASH;
  const valid = await bcrypt.compare(password, hash);
  return admin && valid ? admin : null;
}
