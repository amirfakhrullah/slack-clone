import { SignIn } from "@clerk/nextjs/app-beta";

export default function SignInPage() {
  return (
    <div className="my-auto flex h-screen items-center justify-center bg-gradient-to-b from-indigo-900 to-indigo-950">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  );
}
