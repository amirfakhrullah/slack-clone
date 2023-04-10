import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const useGetMySessionToken = () => {
  const { getToken, sessionId } = useAuth();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchToken = async () => {
    setIsLoading(true);
    const t = await getToken();
    if (t) setToken(t);
    setIsLoading(false);
  };

  useEffect(() => {
    void fetchToken();
    // eslint-disable-next-line
  }, []);

  return {
    sessionId: sessionId ?? "",
    token,
    isLoading,
    refetch: fetchToken,
  };
};

export default useGetMySessionToken;
