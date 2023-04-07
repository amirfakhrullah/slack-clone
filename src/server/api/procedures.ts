import { z } from "zod";
import { procedure } from "./trpc";
import { TRPCError } from "@trpc/server";
import { teams } from "~/db/schema/teams";
import { and, eq } from "drizzle-orm/expressions";

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = procedure;

/**
 * Protected procedure for users
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
 * Protected procedure for teamAdmin
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

      const team = (
        await db
          .select()
          .from(teams)
          .where(and(eq(teams.id, input.teamId)))
      )[0];

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      if (isAdmin && team.ownerId !== userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return next({
        ctx: {
          ...ctx,
          team,
        },
      });
    });
