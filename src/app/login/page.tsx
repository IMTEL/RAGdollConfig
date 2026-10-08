"use client";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";
import { LogIn } from "lucide-react";

export default function LoginPage(props: {
  searchParams: { callbackUrl: string | undefined };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-semibold text-gray-800">
          RAGdoll
        </h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          Sign in or create an account to manage your agents.
        </p>
        <div className="flex flex-col items-center space-y-3">
          <Button
            onClick={async () => {
              await signIn.social({
                provider: "keycloak",
                callbackURL: "/",
              });
            }}
            className="flex w-full items-center justify-center gap-2 py-3"
          >
            <LogIn className="text-xl" />
            <span className="font-medium">Sign in with Keycloak</span>
          </Button>
        </div>
      </div>
    </main>
  );
}
