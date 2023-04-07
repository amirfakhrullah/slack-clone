import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import type { InferModel } from "drizzle-orm";
import { teams } from "./teams";

export const members = pgTable(
  "members",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 191 }).notNull(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdTeamIdIdx: uniqueIndex("user_id_team_id_idx").on(
      table.teamId,
      table.userId
    ),
  })
);

export type Team = InferModel<typeof members>;
