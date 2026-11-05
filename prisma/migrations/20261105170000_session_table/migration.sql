-- connect-pg-simple's session store table, created here (once, via a
-- tracked migration) instead of at app startup. Letting every app process
-- race to CREATE TABLE IF NOT EXISTS on first use is a real race: two
-- processes starting at once can both see "missing" and both try to
-- create it, and the loser gets an unhandled error on its in-flight request.
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS = FALSE);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey'
  ) THEN
    ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
