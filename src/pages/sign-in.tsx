import { SignIn } from "@clerk/nextjs/app-beta";
import { neobrutalism } from "@clerk/themes";

export default function SignInPage() {
  return (
    <div className="my-auto flex items-center justify-center h-screen bg-gradient-to-b from-indigo-900 to-indigo-950">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        appearance={{
          baseTheme: neobrutalism,
          variables: {
            colorPrimary: "black",
          },
        }}
      />
    </div>
  );
}
