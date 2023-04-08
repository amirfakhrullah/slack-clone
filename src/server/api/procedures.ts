import { z } from "zod";
import { procedure } from "./trpc";
import { TRPCError } from "@trpc/server";
import { teams } from "~/db/schema/teams";
import { and, eq } from "drizzle-orm/expressions";
import { members } from "~/db/schema/members";

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = procedure;

/**
 * Protected procedure for users
 * `ctx.userId` will be a type of string
 */
export const userProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/**
 * Protected procedure for team users
 * @param isAdmin pass true if want to set the procedure for admin
 * additional data in ctx - `team` and `member`
 */
export const teamHOFProcedure = (isAdmin: boolean) =>
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
