import { useAuth } from "@clerk/nextjs";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getMinuteDifferenceFromNow } from "~/utils/dateDiff";

interface SessionContextValues {
  token: string;
  sessionId: string;
  isLoading: boolean;
  fetch: () => void;
}
export const SessionContext = createContext<SessionContextValues>({
  token: "",
  sessionId: "",
  isLoading: false,
  fetch: () => null,
});

export const useSessionContext = () => {
  const { fetch, ...rest } = useContext(SessionContext);

  useEffect(() => {
    void fetch();
    // eslint-disable-next-line
  }, []);

  return { ...rest };
};

const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, sessionId } = useAuth();
  const [token, setToken] = useState("");
  const [lastFetched, setLastFetched] = useState<Date>();
  const [isLoading, setIsLoading] = useState(true);

  const fetchToken = async () => {
    console.log(getMinuteDifferenceFromNow(lastFetched ?? new Date()))
    if (!lastFetched || getMinuteDifferenceFromNow(lastFetched) > 1) {
      console.log("fetchinggg");
      setIsLoading(true);
      const t = await getToken();
      if (t) setToken(t);
      setLastFetched(new Date());
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        token,
        sessionId: sessionId || "",
        isLoading,
        fetch: () => void fetchToken(),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export default SessionProvider;
