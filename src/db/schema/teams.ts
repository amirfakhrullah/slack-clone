import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import type { InferModel } from "drizzle-orm";

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  ownerId: varchar("owner", { length: 191 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Team = InferModel<typeof teams>;
