import { z } from "zod";
import { createChannelProcedure, userProcedure } from "../procedures";
import { createTRPCRouter } from "../trpc";
import { chats } from "~/db/schema/chats";
import { and, desc, eq, or } from "drizzle-orm/expressions";
import { clerkClient } from "@clerk/nextjs/server";

export const chatsRouter = createTRPCRouter({
  getWithOtherUser: userProcedure
    .input(
      z.object({
        remoteParticipant: z.string().max(191),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, userId } = ctx;
      const { remoteParticipant } = input;

      const myChats = await db
        .select()
        .from(chats)
        .where(
          or(
            and(
              eq(chats.authorId, userId),
              eq(chats.receiverId, remoteParticipant)
            ),
            and(
              eq(chats.authorId, remoteParticipant),
              eq(chats.receiverId, userId)
            )
          )
        )
        .orderBy(desc(chats.createdAt))
        .limit(50);

      return myChats;
    }),

  getForChannel: createChannelProcedure(false).query(async ({ ctx }) => {
    const { db, channel } = ctx;

    const teamChats = await db
      .select()
      .from(chats)
      .where(eq(chats.channelId, channel.id))
      .orderBy(desc(chats.createdAt))
      .limit(50);

    return teamChats;
  }),

  sendToOtherUser: userProcedure
    .input(
      z.object({
        receiverId: z.string().max(191),
        message: z.string().max(256),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, userId } = ctx;
      const { message, receiverId } = input;

      /**
       * validate if receiverId exists in Clerk
       * Will throw if invalid
       */
      await clerkClient.users.getUser(receiverId);

      await db.insert(chats).values({
        authorId: userId,
        message,
        receiverId,
      });
    }),

  sendToChannel: createChannelProcedure(false)
    .input(
      z.object({
        message: z.string().max(256),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, channel, userId } = ctx;
      const { message } = input;

      await db.insert(chats).values({
        authorId: userId,
        message,
        channelId: channel.id,
      });
    }),
});
