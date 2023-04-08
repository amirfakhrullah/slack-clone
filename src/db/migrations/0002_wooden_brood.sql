DO $$ BEGIN
 CREATE TYPE "role" AS ENUM('user', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE members ADD COLUMN "role" "role" DEFAULT 'user' NOT NULL;