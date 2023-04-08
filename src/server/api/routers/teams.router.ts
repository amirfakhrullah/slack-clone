import { z } from "zod";
import { teamHOFProcedure, userProcedure } from "../procedures";
import { createTRPCRouter } from "../trpc";
import { teams } from "~/db/schema/teams";
import { TRPCError } from "@trpc/server";
import { members } from "~/db/schema/members";
import { and, eq, inArray, ne } from "drizzle-orm/expressions";
import { channels } from "~/db/schema/channels";
import { chats } from "~/db/schema/chats";

export const teamsRouter = createTRPCRouter({
  create: userProcedure
    .input(
      z.object({
        name: z.string().min(4).max(256),
      })
    )
    .mutation(async ({ ctx, input: { name } }) => {
      const { db, userId } = ctx;

      const team = (
        await db
          .insert(teams)
          .values({
            name,
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
            role: "admin",
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

  get: teamHOFProcedure(false).query(async ({ ctx }) => {
    const { db, team, member, userId } = ctx;

    const memberLists = await db
      .select()
      .from(members)
      // only get the remaining members, since we already get self member data in procedure
      .where(and(eq(members.teamId, team.id), ne(members.userId, userId)));

    return {
      team,
      members: [member, ...memberLists],
    };
  }),

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

  updateMemberRole: teamHOFProcedure(true)
    .input(
      z.object({
        memberId: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, team } = ctx;
      const { memberId, role } = input;

      return await db
        .update(members)
        .set({
          role,
        })
        .where(and(eq(members.teamId, team.id), eq(members.id, memberId)))
        .returning();
    }),

  addMembers: teamHOFProcedure(true)
    .input(
      z.object({
        members: z.array(
          z.object({
            userId: z.string().max(191),
            role: z.enum(["user", "admin"]).optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, team } = ctx;
      const { members: requestedMembers } = input;

      await db.insert(members).values(
        requestedMembers.map((obj) => ({
          teamId: team.id,
          userId: obj.userId,
          ...(obj.role && { role: obj.role }),
        }))
      );
    }),

  removeMembers: teamHOFProcedure(true)
    .input(
      z.object({
        memberIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, team } = ctx;
      const { memberIds } = input;

      await db
        .delete(members)
        .where(
          and(eq(members.teamId, team.id), inArray(members.id, memberIds))
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
