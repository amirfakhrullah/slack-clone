import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import type { InferModel } from "drizzle-orm";
import { teams } from "./teams";

export const members = pgTable("members", {
  id: varchar("id", { length: 191 }).primaryKey(),
  userId: varchar("user_id", { length: 191 }).notNull(),
  teamId: varchar("team_id", { length: 191 })
    .notNull()
    .references(() => teams.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Team = InferModel<typeof members>;
