import { eq } from "drizzle-orm/expressions";
import { db } from "~/db/drizzle.config";
import { members } from "~/db/schema/members";
import { teams } from "~/db/schema/teams";
import { users } from "~/db/schema/users";

export const getTeamInfo = async (teamId: number) => {
  const teamMembers = await db
    .select({
      team: {
        id: teams.id,
        name: teams.name,
        createdAt: teams.createdAt,
        owner: teams.ownerId,
      },
      member: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(members)
    .innerJoin(teams, eq(teams.id, members.teamId))
    .innerJoin(users, eq(users.id, members.userId))
    .where(eq(members.teamId, teamId));

  if (teamMembers.length === 0 || !teamMembers[0]) {
    return;
  }

  const team = teamMembers[0].team;

  const owner = (() => {
    const owner = teamMembers.find((m) => m.member.id === team.owner);
    return owner?.member;
  })();

  return {
    ...team,
    owner,
    members: teamMembers.map((m) => m.member),
  };
};
