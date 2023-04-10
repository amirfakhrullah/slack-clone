import { api } from "~/utils/api";
import { toast } from "react-hot-toast";
import { useHandshakeContext } from "~/providers/HandshakeProvider";

const useGetTeamMembers = (teamId: string) => {
  const { isLoading: isHandshaking, key } = useHandshakeContext();
  const { isLoading, data: members } = api.team.getMembers.useQuery(
    {
      key,
      teamId: parseInt(teamId),
    },
    {
      enabled: !isHandshaking && !!key,
      onError: (err) => toast.error(err.message),
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );
  return {
    isLoading: isLoading || isHandshaking,
    members: members ?? [],
  };
};

export default useGetTeamMembers;
