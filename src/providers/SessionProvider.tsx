import { useAuth } from "@clerk/nextjs";
import React, { createContext, useContext, useEffect, useState } from "react";

interface SessionContextValues {
  token: string;
  sessionId: string;
  isLoading: boolean;
}
export const SessionContext = createContext<SessionContextValues>({
  token: "",
  sessionId: "",
  isLoading: false,
});

export const useSessionContext = () => useContext(SessionContext);

const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, sessionId } = useAuth();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const passToken = async () => {
    const t = await getToken();
    if (t) setToken(t);
    setIsLoading(false);
  };

  useEffect(() => {
    if (sessionId) {
      void passToken();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line
  }, [sessionId]);

  return (
    <SessionContext.Provider
      value={{
        token,
        sessionId: sessionId || "",
        isLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export default SessionProvider;
