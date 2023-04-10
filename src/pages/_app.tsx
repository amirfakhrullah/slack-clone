import { type AppType } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";
import { api } from "~/utils/api";

import "~/styles/globals.css";
import { Toaster } from "react-hot-toast";
import { neobrutalism } from "@clerk/themes";

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
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
