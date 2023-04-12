import { z } from "zod";
import { createChannelProcedure, userProcedure } from "../procedures";
import { createTRPCRouter } from "../trpc";
import { type Chat, chats } from "~/db/schema/chats";
import { and, asc, eq, or } from "drizzle-orm/expressions";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
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
            ((data.authorId === remoteParticipant &&
              data.receiverId === userId) ||
              (data.authorId === userId &&
                data.receiverId === remoteParticipant))
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

  // subscriptions for deleting chats one-to-one
  onDeleteInOneToOne: userProcedure.subscription(({ ctx }) => {
    const { userId } = ctx;
    return observable<Chat>((emit) => {
      const onDelete = (data: Chat) => {
        if (
          !data.channelId &&
          (data.authorId === userId || data.receiverId === userId)
        ) {
          emit.next(data);
        }
      };
      ee.on("deleteInOneToOne", onDelete);
      return () => {
        ee.off("deleteInOneToOne", onDelete);
      };
    });
  }),

  // subscriptions for deleting chats in channel
  onDeleteInChannel: createChannelProcedure(false).subscription(({ ctx }) => {
    const { channel } = ctx;
    return observable<Chat>((emit) => {
      const onDelete = (data: Chat) => {
        if (data.channelId === channel.id) {
          emit.next(data);
        }
      };
      ee.on("deleteInChannel", onDelete);
      return () => {
        ee.off("deleteInChannel", onDelete);
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

      return await db
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
        .orderBy(asc(chats.createdAt))
        .limit(50);
    }),

  getForChannel: createChannelProcedure(false).query(async ({ ctx }) => {
    const { db, channel } = ctx;

    return await db
      .select()
      .from(chats)
      .where(eq(chats.channelId, channel.id))
      .orderBy(asc(chats.createdAt))
      .limit(50);
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
      try {
        await clerkClient.users.getUser(receiverId);
      } catch (_) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

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

  hardDelete: userProcedure
    .input(
      z.object({
        chatId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, userId } = ctx;

      const myChat = (
        await db
          .select()
          .from(chats)
          .where(and(eq(chats.id, input.chatId), eq(chats.authorId, userId)))
      )[0];

      if (!myChat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      if (myChat.channelId) {
        ee.emit("deleteInChannel", myChat);
      } else {
        ee.emit("deleteInOneToOne", myChat);
      }

      await db.delete(chats).where(eq(chats.id, myChat.id));
    }),
});
