import { z } from "zod";
import { publicProcedure } from "../procedures";
import { type Session, sessions } from "@clerk/nextjs/dist/api";
import { TRPCError } from "@trpc/server";
import { assignKeyToUser } from "~/server/caches/handshakeMapping";

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

    return {
      key: assignKeyToUser(session.userId),
    };
  });
