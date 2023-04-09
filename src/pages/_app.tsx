import { type AppType } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";
import { api } from "~/utils/api";

import "~/styles/globals.css";
import { Toaster } from "react-hot-toast";
import SessionProvider from "~/providers/SessionProvider";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ClerkProvider {...pageProps}>
      <SessionProvider>
        <Component {...pageProps} />
        <Toaster position="top-right" />
      </SessionProvider>
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
