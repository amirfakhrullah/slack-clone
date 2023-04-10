import { toast } from "react-hot-toast";
import { api } from "~/utils/api";
import { useHandshakeContext } from "~/providers/HandshakeProvider";

const useGetMyTeams = (teamId?: string, channelId?: string) => {
  const { isLoading: isHandshaking, key } = useHandshakeContext();

  const { isLoading, data: myTeams } = api.team.getAll.useQuery(
    {
      key
    },
    {
      enabled: !isHandshaking && !!key,
      onError: (err) => toast.error(err.message),
    }
  );

  return {
    isLoading: isLoading || isHandshaking,
    teamId,
    channelId,
    myTeams,
    currentTeam: myTeams?.find((t) => t.team.id.toString() === teamId),
  };
};

export default useGetMyTeams;
