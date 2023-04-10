import { toast } from "react-hot-toast";
import { api } from "~/utils/api";
import useGetMySessionToken from "./useGetMySessionToken";

const useGetMyTeams = (teamId?: string, channelId?: string) => {
  const {
    isLoading: isFetchingToken,
    token,
    sessionId,
  } = useGetMySessionToken();
  const { isLoading, data: myTeams } = api.team.getAll.useQuery(
    {
      sessionId,
      token,
    },
    {
      enabled: !isFetchingToken && !!token,
      onError: (err) => toast.error(err.message),
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  return {
    isLoading: isLoading || isFetchingToken,
    teamId,
    channelId,
    myTeams,
    currentTeam: myTeams?.find((t) => t.team.id.toString() === teamId),
  };
};

export default useGetMyTeams;