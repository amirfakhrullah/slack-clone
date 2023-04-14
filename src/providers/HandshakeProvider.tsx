import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { api } from "~/utils/api";
import { useAuth } from "@clerk/nextjs";

interface HandshakeContextValues {
  key: string;
  isLoading: boolean;
}

export const HandshakeContext = createContext<HandshakeContextValues>({
  key: "",
  isLoading: false,
});

export const useHandshakeContext = () => useContext(HandshakeContext);

const HandshakeProvider = ({ children }: { children: React.ReactNode }) => {
  const [key, setKey] = useState("");
  const { sessionId, getToken } = useAuth();

  const { mutate, isLoading } = api.handshake.useMutation({
    onError: (err) => toast.error(err.message),
    onSuccess: (data) => setKey(data.key),
  });

  const fetchToken = async () => {
    const token = await getToken();
    if (token) {
      mutate({
        token,
        sessionId: sessionId ?? "",
      });
    }
  };

  useEffect(() => {
    if (sessionId && !key) {
      void fetchToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, sessionId]);

  // refetch every 50 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (key && sessionId) {
        void fetchToken();
      }
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, sessionId]);

  return (
    <HandshakeContext.Provider
      value={{
        key,
        isLoading,
      }}
    >
      {children}
    </HandshakeContext.Provider>
  );
};

export default HandshakeProvider;
