import { z } from "zod";
import { createTeamProcedure, userProcedure } from "../procedures";
import { createTRPCRouter } from "../trpc";
import { teams } from "~/db/schema/teams";
import { TRPCError, type inferRouterOutputs } from "@trpc/server";
import { members } from "~/db/schema/members";
import { and, eq, inArray, ne } from "drizzle-orm/expressions";
import { channels } from "~/db/schema/channels";
import { chats } from "~/db/schema/chats";
import { clerkClient } from "@clerk/nextjs/server";
import {
  MAX_GROUPS_CREATED_PER_USER,
  MAX_MEMBERS_PER_GROUP,
} from "~/limitVars";

export const teamsRouter = createTRPCRouter({
  create: userProcedure
    .input(
      z.object({
        name: z.string().min(4).max(256),
      })
    )
    .mutation(async ({ ctx, input: { name } }) => {
      const { db, userId } = ctx;

      // validation: MAX_GROUPS_CREATED_PER_USER
      const currentTeamsOwned = await db
        .select({
          team: teams.id,
        })
        .from(teams)
        .where(eq(teams.ownerId, userId));

      if (currentTeamsOwned.length >= MAX_GROUPS_CREATED_PER_USER) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `A user can only create ${MAX_GROUPS_CREATED_PER_USER} groups only`,
        });
      }

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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Team failed to be created",
        });
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Member failed to be assigned to the team created",
        });
      }

      return {
        team,
        member,
      };
    }),

  getAll: userProcedure.query(async ({ ctx }) => {
    const { db, userId } = ctx;

    return await db
      .select({
        team: teams,
        member: members,
      })
      .from(members)
      .innerJoin(teams, eq(members.teamId, teams.id))
      .where(eq(members.userId, userId));
  }),

  getById: createTeamProcedure(false).query(async ({ ctx }) => {
    const { db, team, member, userId } = ctx;

    const remainingMemberLists = await db
      .select()
      .from(members)
      // only get the remaining members, since we already get self member data in procedure
      .where(and(eq(members.teamId, team.id), ne(members.userId, userId)));

    return {
      team,
      members: [member, ...remainingMemberLists],
    };
  }),

  update: createTeamProcedure(true)
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

  updateMemberRole: createTeamProcedure(true)
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

  addMembers: createTeamProcedure(true)
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
      const { db, team, member } = ctx;
      const { members: requestedMembers } = input;

      // check is the userIds exist in Clerk
      const users = await clerkClient.users.getUserList({
        userId: requestedMembers.map((member) => member.userId),
      });

      if (users.length !== requestedMembers.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some userIds don't exist",
        });
      }

      // validation: MAX_MEMBERS_PER_GROUP
      const currentMembers = [
        member,
        ...(await db
          .select()
          .from(members)
          .where(and(eq(members.teamId, team.id), ne(members.id, member.id)))),
      ];

      if (
        currentMembers.length + requestedMembers.length >
        MAX_MEMBERS_PER_GROUP
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `A team is only allowed to have ${MAX_MEMBERS_PER_GROUP} members only`,
        });
      }

      await db.insert(members).values(
        requestedMembers.map((obj) => ({
          teamId: team.id,
          userId: obj.userId,
          ...(obj.role && { role: obj.role }),
        }))
      );
    }),

  removeMembers: createTeamProcedure(true)
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

  hardDelete: createTeamProcedure(true).mutation(async ({ ctx }) => {
    const { db, team } = ctx;

    /**
     * Need to run in sequence since some tables relies on other tables
     * Sequence:
     * 1- Get all channelIds that belong to the team
     * 2- Delete all chats with the channelIds
     * 3- Delete all channels with the teamId
     * 4- Delete all members with the teamId
     * 5- Delete the team by teamId
     */
    await db
      .select({
        channelId: channels.id,
      })
      .from(channels)
      .where(eq(channels.teamId, team.id))
      .then((teamChannels) =>
        db
          .delete(chats)
          .where(
            inArray(
              chats.channelId,
              teamChannels.map((channel) => channel.channelId)
            )
          )
          .then(() =>
            db
              .delete(channels)
              .where(eq(channels.teamId, team.id))
              .then(() =>
                db
                  .delete(members)
                  .where(eq(members.teamId, team.id))
                  .then(() => db.delete(teams).where(eq(teams.id, team.id)))
              )
          )
      );
  }),
});

export type TeamsRouterOutputs = inferRouterOutputs<typeof teamsRouter>;
