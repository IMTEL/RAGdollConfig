"use client";
import { Button } from "@/components/ui/button";
import {
  googleSignIn,
  keycloakRegister,
  keycloakSignIn,
  testUserSignIn,
} from "@/lib/auth";
import { LogIn, User, UserPlus } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      console.error(error);
      alert(
        "An error has occured when trying to login, check console for details"
      );
    }
  }, [error]);

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
            onClick={keycloakSignIn}
            className="flex w-full items-center justify-center gap-2 py-3"
          >
            <LogIn className="text-xl" />
            <span className="font-medium">Sign in with Keycloak</span>
          </Button>
          <Button
            onClick={keycloakRegister}
            variant="outline"
            className="flex w-full items-center justify-center gap-2 py-3"
          >
            <UserPlus className="text-xl" />
            <span className="font-medium">Create account</span>
          </Button>
          <Button
            onClick={googleSignIn}
            variant="outline"
            className="flex w-full items-center justify-center gap-2 py-3"
          >
            <FcGoogle className="text-xl" />
            <span className="font-medium">Sign in with Google</span>
          </Button>
          {process.env.NODE_ENV === "development" && (
            <Button
              onClick={testUserSignIn}
              variant="outline"
              className="flex w-full items-center justify-center gap-2 py-3"
            >
              <User className="text-xl" />
              <span className="font-medium">Test Account</span>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-100">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
