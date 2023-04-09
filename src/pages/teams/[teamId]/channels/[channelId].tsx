import { type GetServerSidePropsContext } from "next";
import React from "react";
import { toast } from "react-hot-toast";
import Header from "~/components/Header";
import MetaHead from "~/components/MetaHead";
import Screen from "~/components/Screen";
import Sidebar from "~/components/Sidebar";
import { useSessionContext } from "~/providers/SessionProvider";
import { api } from "~/utils/api";

const ChannelIdPage = ({
  teamId,
  channelId,
}: {
  teamId: string;
  channelId: string;
}) => {
  const { isLoading: isFetchingToken, sessionId, token } = useSessionContext();
  const { isLoading, data: channel } = api.channel.getById.useQuery(
    {
      sessionId,
      token,
      teamId: parseInt(teamId),
      channelId: parseInt(channelId),
    },
    {
      enabled: !isFetchingToken && !!token,
      onError: (err) => toast.error(err.message),
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  return (
    <>
      <MetaHead>Channel {channelId} | Slack Clone</MetaHead>
      <Screen className="flex flex-row">
        <Header
          chatterName={
            isFetchingToken || isLoading ? "Loading..." : channel?.name
          }
        />
        <Sidebar teamId={teamId} channelId={channelId} />
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
