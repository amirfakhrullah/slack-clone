import { type GetServerSidePropsContext } from "next";
import Header from "~/components/Header";
import InitialScreen from "~/components/InitialScreen";
import MetaHead from "~/components/MetaHead";
import Screen from "~/components/Screen";
import Sidebar from "~/components/Sidebar";

const TeamIdPage = ({ teamId }: { teamId: string }) => {
  return (
    <>
      <MetaHead>{`Team ${teamId} | Slack Clone`}</MetaHead>
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
