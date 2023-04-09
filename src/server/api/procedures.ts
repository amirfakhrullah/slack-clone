import { z } from "zod";
import { procedure } from "./trpc";
import { TRPCError } from "@trpc/server";
import { teams } from "~/db/schema/teams";
import { and, eq } from "drizzle-orm/expressions";
import { members } from "~/db/schema/members";
import { channels } from "~/db/schema/channels";
import { sessions } from "@clerk/nextjs/dist/api";

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = procedure;

/**
 * Protected procedure for users
 * `ctx.userId` will be a type of string
 */
export const userProcedure = publicProcedure
  .input(
    z.object({
      sessionId: z.string(),
      token: z.string(),
    })
  )
  .use(async ({ ctx, input, next }) => {
    const { sessionId, token } = input;
    const session = await sessions.verifySession(sessionId, token);
    if (!session.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        ...ctx,
        userId: session.userId,
      },
    });
  });

/**
 * Protected procedure for team users
 * @param isAdmin pass true if want to set the procedure for admin
 * additional data in ctx - `team` and `member`
 */
export const createTeamProcedure = (isAdmin: boolean) =>
  userProcedure
    .input(
      z.object({
        teamId: z.number(),
      })
    )
    .use(async ({ ctx, input, next }) => {
      const { db, userId } = ctx;

      const foundMembers = await db
        .select({
          team: teams,
          member: members,
        })
        .from(members)
        .innerJoin(teams, eq(members.teamId, teams.id))
        .where(
          and(eq(members.teamId, input.teamId), eq(members.userId, userId))
        );

      if (!foundMembers[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      const self = foundMembers[0];

      if (isAdmin && self.member.role !== "admin") {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return next({
        ctx: {
          ...ctx,
          ...self,
        },
      });
    });

/**
 * Protected procedure for channels
 * @param isAdmin pass true if want to set the procedure for admin
 * additional data in ctx - `team`, `member` & `channel`
 */
export const createChannelProcedure = (isTeamAdmin: boolean) =>
  createTeamProcedure(isTeamAdmin)
    .input(
      z.object({
        channelId: z.number(),
      })
    )
    .use(async ({ ctx, input, next }) => {
      const { db, team } = ctx;

      const channel = (
        await db
          .select()
          .from(channels)
          .where(
            and(eq(channels.teamId, team.id), eq(channels.id, input.channelId))
          )
      )[0];

      if (!channel) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return next({
        ctx: {
          ...ctx,
          channel,
        },
      });
    });
