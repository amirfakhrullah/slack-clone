import { index, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import type { InferModel } from "drizzle-orm";
import { channels } from "./channels";

export const chats = pgTable(
  "chats",
  {
    id: serial("id").primaryKey(),
    message: varchar("message", { length: 256 }).notNull(),
    channelId: integer("channel_id").references(
      () => channels.id
    ),
    receiverId: varchar("receiver_id", { length: 191 }),
    authorId: varchar("owner_id", { length: 191 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    channelIdx: index("channel_idx").on(table.channelId),
  })
);

export type Chat = InferModel<typeof chats>;
