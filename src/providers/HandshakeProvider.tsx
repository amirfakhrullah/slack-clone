import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { api } from "~/utils/api";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [key, setKey] = useState("");
  const { sessionId, getToken } = useAuth();

  const { mutate, isLoading } = api.handshake.useMutation({
    onError: (err) => toast.error(err.message),
    onSuccess: (data) => {
      setKey(data.key);
      console.log(isLoading);
    },
  });

  const fetchToken = async () => {
    const token = await getToken();
    if (token && sessionId) {
      mutate({
        token,
        sessionId: sessionId ?? "",
      });
    }
  };

  useEffect(() => {
    if (
      !key &&
      !pathname.startsWith("/sign-in") &&
      !pathname.startsWith("/sign-up")
    ) {
      void fetchToken();
    }
    // eslint-disable-next-line
  }, [key, pathname, sessionId]);

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
