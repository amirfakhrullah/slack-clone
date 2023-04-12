import { type GetServerSidePropsContext } from "next";
import { useEffect } from "react";
import Header from "~/components/Header";
import InitialScreen from "~/components/InitialScreen";
import MetaHead from "~/components/MetaHead";
import Screen from "~/components/Screen";
import Sidebar from "~/components/Sidebar";
import { useTeamContext } from "~/providers/TeamProvider";

const TeamIdPage = ({ teamId }: { teamId: string }) => {
  const { setCurrentTeamId, currentTeamId, isLoadingTeam, team } =
    useTeamContext();

  useEffect(() => {
    if (currentTeamId !== teamId) {
      setCurrentTeamId(teamId);
    }
    // eslint-disable-next-line
  }, [teamId]);

  return (
    <>
      <MetaHead>
        {isLoadingTeam ? "Loading..." : `Team | ${team?.name ?? teamId}`}
      </MetaHead>
      <Screen className="flex flex-row">
        <Header />
        <Sidebar teamId={teamId} />
        <InitialScreen />
      </Screen>
    </>
  );
};

export const getServerSideProps = ({ query }: GetServerSidePropsContext) => {
  const { teamId } = query;

  if (!teamId || typeof teamId !== "string") {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      teamId,
    },
  };
};

export default TeamIdPage;
