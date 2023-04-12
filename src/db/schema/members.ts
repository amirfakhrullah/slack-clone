import {
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import type { InferModel } from "drizzle-orm";
import { teams } from "./teams";

export const UserRole = pgEnum("role", ["user", "admin"]);

export const members = pgTable(
  "members",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 191 }).notNull(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id),
    role: UserRole("role").notNull().default("user"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdTeamIdIdx: uniqueIndex("user_id_team_id_idx").on(
      table.teamId,
      table.userId
    ),
  })
);

export type Member = InferModel<typeof members>;
