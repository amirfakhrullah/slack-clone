import { channels } from "~/db/schema/channels";
import { createChannelProcedure, createTeamProcedure } from "../procedures";
import { createTRPCRouter } from "../trpc";
import { eq } from "drizzle-orm/expressions";
import { z } from "zod";
import { chats } from "~/db/schema/chats";
import { MAX_CHANNELS_PER_GROUP } from "~/limitVars";
import { TRPCError } from "@trpc/server";

export const channelsRouter = createTRPCRouter({
  create: createTeamProcedure(true)
    .input(
      z.object({
        name: z.string().min(4).max(256),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, team } = ctx;

      // validation: MAX_CHANNELS_PER_GROUP
      const allTeamChannels = await db
        .select({
          id: channels.id,
        })
        .from(channels)
        .where(eq(channels.teamId, team.id));

      if (allTeamChannels.length >= MAX_CHANNELS_PER_GROUP) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `A team can only create ${MAX_CHANNELS_PER_GROUP} channels only`,
        });
      }

      const newChannel = (
        await db
          .insert(channels)
          .values({
            name: input.name,
            teamId: team.id,
          })
          .returning()
      )[0];

      if (!newChannel) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Channel failed to be created",
        });
      }
      return newChannel;
    }),

  getById: createChannelProcedure(false).query(({ ctx }) => ctx.channel),

  getAll: createTeamProcedure(false).query(async ({ ctx }) => {
    const { db, team } = ctx;

    return await db
      .select({
        id: channels.id,
        name: channels.name,
        createdAt: channels.createdAt,
      })
      .from(channels)
      .where(eq(channels.teamId, team.id));
  }),

  update: createChannelProcedure(true)
    .input(
      z.object({
        name: z.string().min(4).max(256),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, channel } = ctx;

      const updatedChannels = await db
        .update(channels)
        .set({
          name: input.name,
        })
        .where(eq(channels.id, channel.id))
        .returning();

      return updatedChannels[0];
    }),

  delete: createChannelProcedure(true).mutation(async ({ ctx }) => {
    const { db, channel } = ctx;

    /**
     * Need to run in sequence because chats table relies on channels table
     * Sequence:
     * 1- Delete chats with the channelId
     * 2- Delete channels with the channelId
     */
    await db.delete(chats).where(eq(chats.channelId, channel.id));
    await db.delete(channels).where(eq(channels.id, channel.id));
  }),
});