import { z } from "zod";
import { db } from "~/db/drizzle.config";
import { members } from "~/db/schema/members";
import { teams } from "~/db/schema/teams";
import { eq } from "drizzle-orm/expressions";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(async () => {
      const allUsers = await db
        .select()
        .from(teams)
        .leftJoin(members, eq(teams.id, members.teamId));

      return {
        greeting: `Hello ${JSON.stringify(allUsers)}`,
      };
    }),
});
