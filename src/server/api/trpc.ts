import { db } from "~/db/drizzle.config";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getAuth } from "@clerk/nextjs/server";

export const createTRPCContext = (opts: CreateNextContextOptions) => {
  const { req } = opts;
  const session = getAuth(req);
  return {
    db,
    userId: session.userId,
  };
};

/**
 * INITIALIZATION
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * ROUTER
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 */
export const procedure = t.procedure;
