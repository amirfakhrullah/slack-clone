import {
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import type { InferModel } from "drizzle-orm";
import { users } from "./users";

export const teams = pgTable("teams", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  ownerId: varchar("owner", { length: 191 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Team = InferModel<typeof teams>;
