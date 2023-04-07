import { z } from "zod";
import { teamHOFProcedure, userProcedure } from "../procedures";
import { createTRPCRouter } from "../trpc";
import { teams } from "~/db/schema/teams";
import { TRPCError } from "@trpc/server";
import { members } from "~/db/schema/members";
import { and, eq, inArray } from "drizzle-orm/expressions";
import { channels } from "~/db/schema/channels";
import { chats } from "~/db/schema/chats";

export const teamsRouter = createTRPCRouter({
  create: userProcedure
    .input(z.string().min(4).max(256))
    .mutation(async ({ ctx, input: groupName }) => {
      const { db, userId } = ctx;

      const team = (
        await db
          .insert(teams)
          .values({
            name: groupName,
            ownerId: userId,
          })
          .returning({
            id: teams.id,
            name: teams.name,
            createdAt: teams.createdAt,
          })
      )[0];

      if (!team) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      const member = (
        await db
          .insert(members)
          .values({
            userId,
            teamId: team.id,
          })
          .returning({ id: members.id })
      )[0];

      if (!member) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return {
        ...team,
        memberId: member.id,
      };
    }),

  get: teamHOFProcedure(false).query(({ ctx }) => ctx.team),

  update: teamHOFProcedure(true)
    .input(
      z.object({
        name: z.string().min(4).max(256),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, team } = ctx;
      const { name } = input;

      await db
        .update(teams)
        .set({
          name,
        })
        .where(eq(teams.id, team.id));
    }),

  addMembers: teamHOFProcedure(true)
    .input(
      z.object({
        members: z.array(z.string().max(191)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, team } = ctx;
      const { members: userIds } = input;

      await db.insert(members).values(
        userIds.map((userId) => ({
          teamId: team.id,
          userId,
        }))
      );
    }),

  removeMembers: teamHOFProcedure(true)
    .input(
      z.object({
        members: z.array(z.string().max(191)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, team } = ctx;
      const { members: userIds } = input;

      await db
        .delete(members)
        .where(
          and(eq(members.teamId, team.id), inArray(members.userId, userIds))
        );
    }),

  delete: teamHOFProcedure(true).mutation(async ({ ctx }) => {
    const { db, team } = ctx;

    const teamChannels = await db
      .select({
        channelId: channels.id,
      })
      .from(channels)
      .where(eq(channels.teamId, team.id));

    await Promise.all([
      db.delete(chats).where(
        inArray(
          chats.channelId,
          teamChannels.map((channel) => channel.channelId)
        )
      ),
      db.delete(channels).where(eq(channels.teamId, team.id)),
      db.delete(members).where(eq(members.teamId, team.id)),
      db.delete(teams).where(eq(teams.id, team.id)),
    ]);
  }),
});
