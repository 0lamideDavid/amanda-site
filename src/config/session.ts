import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { env, isProduction } from "./env";

// When DATABASE_URL is set, persist sessions in Postgres so they survive
// server restarts. Otherwise (preview / design-only mode) fall back to the
// default in-memory store — fine for read-only public views.
function buildStore() {
  if (!env.DATABASE_URL) return undefined; // express-session uses MemoryStore
  const isDirectSupabase =
    env.DATABASE_URL.includes("supabase.co") &&
    !env.DATABASE_URL.includes("pooler.supabase.com");
  if (isDirectSupabase) {
    console.warn("Direct Supabase connection (db.*.supabase.co:5432) detected on serverless; using MemoryStore to avoid IPv6 connection failure. Use Supabase pooler URL instead.");
    return undefined;
  }
  const isRemoteDb =
    env.DATABASE_URL.includes("supabase.co") ||
    env.DATABASE_URL.includes("pooler.supabase.com") ||
    env.DATABASE_URL.includes("sslmode=require");
  const pgPool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
  });
  // Prevent unhandled error events on idle or disconnected clients from crashing the process
  pgPool.on("error", (err) => {
    console.error("Postgres session pool error:", err);
  });
  const PgSession = connectPgSimple(session);
  return new PgSession({ pool: pgPool, tableName: "session", createTableIfMissing: false });
}

export const sessionMiddleware = session({
  store: buildStore(),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  },
});
