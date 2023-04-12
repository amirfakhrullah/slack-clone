import { type AppType } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";
import { api } from "~/utils/api";

import "~/styles/globals.css";
import { Toaster } from "react-hot-toast";
import { neobrutalism } from "@clerk/themes";
import HandshakeProvider from "~/providers/HandshakeProvider";
import TeamProvider from "~/providers/TeamProvider";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ClerkProvider
      {...pageProps}
      appearance={{
        baseTheme: neobrutalism,
        variables: {
          colorPrimary: "#312e81",
        },
      }}
    >
      <HandshakeProvider>
        <TeamProvider>
          <Component {...pageProps} />
          <Toaster position="top-right" />
        </TeamProvider>
      </HandshakeProvider>
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
