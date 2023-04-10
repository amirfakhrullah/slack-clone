import { z } from "zod";
import { procedure } from "./trpc";
import { TRPCError } from "@trpc/server";
import { teams } from "~/db/schema/teams";
import { and, eq } from "drizzle-orm/expressions";
import { members } from "~/db/schema/members";
import { channels } from "~/db/schema/channels";
import { type Session, sessions } from "@clerk/nextjs/dist/api";
import { uuid } from "uuidv4";

// userId to ws token
const handshakeMapping = new Map<
  string,
  {
    userId: string;
    lastFetched: Date;
  }
>();

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = procedure;

export const handshakeRouter = publicProcedure
  .input(
    z.object({
      sessionId: z.string(),
      token: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const { sessionId, token } = input;
    let session: Session;

    try {
      session = await sessions.verifySession(sessionId, token);
    } catch (_) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    let key = uuid();
    // to avoid getting similar key with other users
    while (handshakeMapping.has(key)) {
      key = uuid();
    }

    handshakeMapping.set(key, {
      userId: session.userId,
      lastFetched: new Date(),
    });
    return { key };
  });

/**
 * Protected procedure for users
 * `ctx.userId` will be a type of string
 */
export const userProcedure = publicProcedure
  .input(
    z.object({
      key: z.string(),
    })
  )
  .use(async ({ ctx, input, next }) => {
    const { key } = input;
    if (!handshakeMapping.has(key)) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { userId } = handshakeMapping.get(key)!;

    return next({
      ctx: {
        ...ctx,
        userId,
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
