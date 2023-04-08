import { z } from "zod";
import { createChannelProcedure, userProcedure } from "../procedures";
import { createTRPCRouter } from "../trpc";
import { type Chat, chats } from "~/db/schema/chats";
import { and, desc, eq, or } from "drizzle-orm/expressions";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError, type inferRouterOutputs } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import EventEmitter, { type MyEventEmitter } from "events";

// types in types.d.ts
export const ee = new EventEmitter() as MyEventEmitter;

export const chatsRouter = createTRPCRouter({
  // subscriptions for one-to-one chats
  onAddToOtherUser: userProcedure
    .input(
      z.object({
        remoteParticipant: z.string().max(191),
      })
    )
    .subscription(({ ctx, input }) => {
      const { userId } = ctx;
      const { remoteParticipant } = input;

      return observable<Chat>((emit) => {
        const onAdd = (data: Chat) => {
          if (
            !data.channelId &&
            ((data.authorId === userId &&
              data.receiverId === remoteParticipant) ||
              (data.authorId === remoteParticipant &&
                data.receiverId === userId))
          ) {
            emit.next(data);
          }
        };
        ee.on("addOneToOne", onAdd);
        return () => {
          ee.off("addOneToOne", onAdd);
        };
      });
    }),

  // subscriptions for channel chats
  onAddToChannel: createChannelProcedure(false).subscription(({ ctx }) => {
    const { channel } = ctx;
    return observable<Chat>((emit) => {
      const onAdd = (data: Chat) => {
        if (data.channelId === channel.id) {
          emit.next(data);
        }
      };
      ee.on("addToChannel", onAdd);
      return () => {
        ee.off("addToChannel", onAdd);
      };
    });
  }),

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

      const newChat = (
        await db
          .insert(chats)
          .values({
            authorId: userId,
            message,
            receiverId,
          })
          .returning()
      )[0];

      if (!newChat) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to send the message",
        });
      }
      ee.emit("addOneToOne", newChat);
      return newChat;
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

      const newChat = (
        await db
          .insert(chats)
          .values({
            authorId: userId,
            message,
            channelId: channel.id,
          })
          .returning()
      )[0];

      if (!newChat) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to send the message",
        });
      }
      ee.emit("addToChannel", newChat);
      return newChat;
    }),
});

export type ChatsRouterOutputs = inferRouterOutputs<typeof chatsRouter>;
