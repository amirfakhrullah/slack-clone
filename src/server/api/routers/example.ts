import { z } from "zod";
import { members } from "~/db/schema/members";
import { teams } from "~/db/schema/teams";
import { eq } from "drizzle-orm/expressions";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(async ({ ctx }) => {
      const allUsers = await ctx.db
        .select()
        .from(teams)
        .leftJoin(members, eq(teams.id, members.teamId));

      return {
        greeting: `Hello ${JSON.stringify(allUsers)}`,
      };
    }),
});
