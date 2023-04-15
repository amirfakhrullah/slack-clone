import { useHandshakeContext } from "~/providers/HandshakeProvider";
import { api } from "~/utils/api";

const useGetTeamChannels = (teamId: string) => {
  const { isLoading: isHandshaking, key } = useHandshakeContext();

  const { isLoading, data: channels } = api.channel.getAll.useQuery(
    {
      key,
      teamId: parseInt(teamId),
    },
    {
      enabled: !isHandshaking && !!key,
    }
  );
  return {
    isLoading: isHandshaking || isLoading,
    channels: channels ?? [],
  };
};

export default useGetTeamChannels;
