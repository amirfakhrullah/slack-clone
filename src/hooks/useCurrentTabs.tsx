import { usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import { useSessionContext } from "~/providers/SessionProvider";
import { api } from "~/utils/api";

const useCurrentTabs = () => {
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
    }
  );

  const teamId = pathname?.split("/")[2]

  return {
    isLoading: isLoading || isTokenFetching,
    teamId,
    pathname,
    myTeams,
  };
};

export default useCurrentTabs;
