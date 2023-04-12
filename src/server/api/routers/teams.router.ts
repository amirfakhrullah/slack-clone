import { z } from "zod";
import { createTeamProcedure, userProcedure } from "../procedures";
import { createTRPCRouter } from "../trpc";
import { teams } from "~/db/schema/teams";
import { TRPCError } from "@trpc/server";
import { type Member, members } from "~/db/schema/members";
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
          id: teams.id,
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
    const { db, team, selfMember } = ctx;

    const remainingMemberLists = await db
      .select({
        id: members.id,
        role: members.role,
        userId: members.userId,
      })
      .from(members)
      // only get the remaining members, since we already get self member data in procedure
      .where(and(eq(members.teamId, team.id), ne(members.id, selfMember.id)));

    const userIdToMemberDataMapping = new Map<
      string,
      Pick<Member, "id" | "role" | "userId">
    >();
    userIdToMemberDataMapping.set(selfMember.userId, {
      id: selfMember.id,
      role: selfMember.role,
      userId: selfMember.userId,
    });
    for (const member of remainingMemberLists) {
      userIdToMemberDataMapping.set(member.userId, member);
    }

    const membersClerkInfo = await clerkClient.users.getUserList({
      userId: Array.from(userIdToMemberDataMapping.keys()),
    });

    return {
      team,
      members: membersClerkInfo.map((info) => ({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ...userIdToMemberDataMapping.get(info.id)!,
        clerkInfo: info,
      })),
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
      const { db, team, selfMember } = ctx;
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
        selfMember,
        ...(await db
          .select()
          .from(members)
          .where(
            and(eq(members.teamId, team.id), ne(members.id, selfMember.id))
          )),
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
     * Need to run in sequence since some tables relies on other tables (so cannot use Promise.all)
     * Sequence:
     * 1- Get all channelIds that belong to the team
     * 2- Delete all chats with the channelIds
     * 3- Delete all channels with the teamId or channelIds
     * 4- Delete all members with the teamId
     * 5- Delete the team by teamId
     */
    const channelIds = (
      await db
        .select({
          channelId: channels.id,
        })
        .from(channels)
        .where(eq(channels.teamId, team.id))
    ).map((channels) => channels.channelId);

    await db.delete(chats).where(inArray(chats.channelId, channelIds));
    await db.delete(channels).where(eq(channels.teamId, team.id));
    await db.delete(members).where(eq(members.teamId, team.id));
    await db.delete(teams).where(eq(teams.id, team.id));
  }),
});
