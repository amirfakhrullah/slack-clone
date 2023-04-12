import { type GetServerSidePropsContext } from "next";
import { useEffect } from "react";
import Header from "~/components/Header";
import MetaHead from "~/components/MetaHead";
import Screen from "~/components/Screen";
import Sidebar from "~/components/Sidebar";
import TeamChat from "~/components/sections/TeamChat";
import { useTeamContext } from "~/providers/TeamProvider";

const ChannelIdPage = ({
  teamId,
  channelId,
}: {
  teamId: string;
  channelId: string;
}) => {
  const {
    setCurrentTeamId,
    currentTeamId,
    currentChannelId,
    setCurrentChannelId,
    isLoadingChannel,
    channel,
  } = useTeamContext();

  useEffect(() => {
    if (currentTeamId !== teamId) {
      setCurrentTeamId(teamId);
    }
    if (currentChannelId !== channelId) {
      setCurrentChannelId(channelId);
    }
    // eslint-disable-next-line
  }, [teamId, channelId]);

  return (
    <>
      <MetaHead>
        {isLoadingChannel
          ? "Loading..."
          : `Channel | ${channel?.name ?? channelId}`}
      </MetaHead>
      <Screen className="flex flex-row">
        <Header
          chatterName={
            isLoadingChannel ? "Loading..." : channel?.name ?? channelId
          }
        />
        <Sidebar teamId={teamId} channelId={channelId} />
        <TeamChat teamId={teamId} channelId={channelId} />
      </Screen>
    </>
  );
};

export const getServerSideProps = ({ query }: GetServerSidePropsContext) => {
  const { channelId, teamId } = query;

  if (
    !channelId ||
    !teamId ||
    typeof channelId !== "string" ||
    typeof teamId !== "string"
  ) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      channelId,
      teamId,
    },
  };
};

export default ChannelIdPage;
