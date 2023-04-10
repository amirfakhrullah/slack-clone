import { api } from "~/utils/api";
import useGetMySessionToken from "./useGetMySessionToken";
import { toast } from "react-hot-toast";

const useGetTeamMembers = (teamId: string) => {
  const {
    isLoading: isFetchingToken,
    token,
    sessionId,
  } = useGetMySessionToken();
  const { isLoading, data: members } = api.team.getMembers.useQuery(
    {
      sessionId,
      token,
      teamId: parseInt(teamId),
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
    members: members ?? [],
  };
};

export default useGetTeamMembers;
