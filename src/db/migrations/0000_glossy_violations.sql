DROP TABLE "chats";
DROP TABLE "channels";
DROP TABLE "members";
DROP TABLE "teams";

CREATE TABLE IF NOT EXISTS "channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"team_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" varchar(256) NOT NULL,
	"channel_id" integer,
	"receiver_id" varchar(191),
	"owner_id" varchar(191) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(191) NOT NULL,
	"team_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"owner" varchar(191) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE channels ADD CONSTRAINT channels_team_id_teams_id_fk FOREIGN KEY ("team_id") REFERENCES teams("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE chats ADD CONSTRAINT chats_channel_id_channels_id_fk FOREIGN KEY ("channel_id") REFERENCES channels("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE members ADD CONSTRAINT members_team_id_teams_id_fk FOREIGN KEY ("team_id") REFERENCES teams("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS team_id ON channels ("team_id");
CREATE INDEX IF NOT EXISTS channel_idx ON chats ("channel_id");