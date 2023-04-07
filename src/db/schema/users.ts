// import { pgTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
// import type { InferModel } from "drizzle-orm";

// export const users = pgTable(
//   "users",
//   {
//     id: varchar("id", { length: 191 }).primaryKey(),
//     name: varchar("name", { length: 191 }).notNull(),
//     email: varchar("email", { length: 191 }).notNull(),
//     password: varchar("password", { length: 256 }).notNull(),
//     createdAt: timestamp("created_at").notNull().defaultNow(),
//   },
//   (table) => ({
//     uniqueIdx: uniqueIndex("unique_idx").on(table.email),
//   })
// );

// export type User = InferModel<typeof users>;
