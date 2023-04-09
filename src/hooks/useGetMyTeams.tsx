import { usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import { useSessionContext } from "~/providers/SessionProvider";
import { api } from "~/utils/api";

const useGetMyTeams = () => {
  const { isLoading: isTokenFetching, token, sessionId } = useSessionContext();
  const pathname = usePathname();
  const { isLoading, data: myTeams } = api.team.getAll.useQuery(
    {
      sessionId,
      token,
    },
    {
      enabled: !isTokenFetching && !!token,
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
    isLoading: isLoading || isTokenFetching,
    teamId,
    channelId,
    pathname,
    myTeams,
  };
};

export default useGetMyTeams;
