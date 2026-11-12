import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({
  path: path.resolve(process.cwd(), process.env.NODE_ENV === "test" ? ".env.test" : ".env"),
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().min(16).default("preview-mode-default-secret-key-32chars"),
  // All optional: email notifications degrade to a no-op (logged, not
  // thrown) when unconfigured, so the app works without them in dev/test.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  ADMIN_NOTIFICATION_EMAIL: z.string().optional(),
  APP_BASE_URL: z.string().default("http://localhost:3000"),
  // Already read raw by prisma/seed.ts; exposed here too so the running
  // app can use it as the admin-notification-email fallback.
  SEED_ADMIN_EMAIL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
