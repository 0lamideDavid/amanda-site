import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { env, isProduction } from "./env";

// When DATABASE_URL is set, persist sessions in Postgres so they survive
// server restarts. Otherwise (preview / design-only mode) fall back to the
// default in-memory store — fine for read-only public views.
function buildStore() {
  if (!env.DATABASE_URL) return undefined; // express-session uses MemoryStore
  const pgPool = new Pool({ connectionString: env.DATABASE_URL });
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
