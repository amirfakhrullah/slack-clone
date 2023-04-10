import { usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import { api } from "~/utils/api";
import useGetMySessionToken from "./useGetMySessionToken";

const useGetMyTeams = () => {
  const {
    isLoading: isFetchingToken,
    token,
    sessionId,
  } = useGetMySessionToken();
  const pathname = usePathname();
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

  const teamId = pathname.startsWith("/teams")
    ? pathname?.split("/")[2]
    : undefined;
  const channelId = pathname.startsWith("/teams")
    ? pathname?.split("/")[3]
    : undefined;

  return {
    isLoading: isLoading || isFetchingToken,
    teamId,
    channelId,
    pathname,
    myTeams,
  };
};

export default useGetMyTeams;
