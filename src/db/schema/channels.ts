import { index, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import type { InferModel } from "drizzle-orm";
import { teams } from "./teams";

export const channels = pgTable(
  "channels",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    name: varchar("name", { length: 256 }).notNull(),
    teamId: varchar("team_id", { length: 191 })
      .notNull()
      .references(() => teams.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    teamIdIdx: index("team_id").on(table.teamId),
  })
);

export type Channel = InferModel<typeof channels>;
