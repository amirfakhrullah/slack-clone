import { type GetServerSidePropsContext } from "next";
import { toast } from "react-hot-toast";
import Header from "~/components/Header";
import MetaHead from "~/components/MetaHead";
import Screen from "~/components/Screen";
import Sidebar from "~/components/Sidebar";
import TeamChat from "~/components/sections/TeamChat";
import { useHandshakeContext } from "~/providers/HandshakeProvider";
import { api } from "~/utils/api";

const ChannelIdPage = ({
  teamId,
  channelId,
}: {
  teamId: string;
  channelId: string;
}) => {
  const {
    isLoading: isHandshaking,
    key,
  } = useHandshakeContext();
  const { isLoading, data: channel } = api.channel.getById.useQuery(
    {
      key,
      teamId: parseInt(teamId),
      channelId: parseInt(channelId),
    },
    {
      enabled: !isHandshaking && !!key,
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <>
      <MetaHead>{`Channel ${channelId} | Slack Clone`}</MetaHead>
      <Screen className="flex flex-row">
        <Header
          chatterName={
            isHandshaking || isLoading ? "Loading..." : channel?.name
          }
        />
        <Sidebar teamId={teamId} channelId={channelId} />
        <TeamChat teamId={teamId} channelId={channelId}  />
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
