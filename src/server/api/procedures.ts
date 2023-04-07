import { procedure } from "./trpc";
import { TRPCError } from "@trpc/server";

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = procedure;

/**
 * Protected procedure
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
