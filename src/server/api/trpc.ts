import { db } from "../../db/drizzle.config";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getAuth } from "@clerk/nextjs/server";
import { type NodeHTTPCreateContextFnOptions } from "@trpc/server/dist/adapters/node-http";
import { type IncomingMessage } from "http";
import type ws from "ws";
import { sessions } from "@clerk/nextjs/dist/api";

export const createTRPCContext = async (
  opts:
    | CreateNextContextOptions
    | NodeHTTPCreateContextFnOptions<IncomingMessage, ws>
) => {
  const { req } = opts;
  let userId: string | null = null;

  if ("cookies" in req) {
    const session = getAuth(req);
    userId = session.userId;
  } else if (req.token && req.sessionId) {
    const session = await sessions.verifySession(req.sessionId, req.token);
    userId = session.userId;
  }
  return {
    db,
    userId,
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
