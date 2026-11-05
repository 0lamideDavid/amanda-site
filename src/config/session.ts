import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { env, isProduction } from "./env";

// Sessions are persisted in Postgres (the same database as the app data) via
// connect-pg-simple, so admin sessions survive server restarts without adding
// a separate store like Redis. The "session" table is created by the
// "session_table" migration, not at runtime: letting every app process
// independently CREATE TABLE IF NOT EXISTS on first use is a real race
// between concurrent processes (see that migration's comment).
const pgPool = new Pool({ connectionString: env.DATABASE_URL });
const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgSession({ pool: pgPool, tableName: "session", createTableIfMissing: false }),
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
