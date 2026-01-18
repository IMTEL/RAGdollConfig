"use client";
import { Button } from "@/components/ui/button";
import { googleSignIn, testUserSignIn } from "@/lib/auth";
import { User } from "lucide-react";
import { useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function LoginContent() {
  const { data: session } = useSession();
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
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-80 rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-semibold text-gray-800">
          Sign in
        </h1>
        <div className="flex flex-col items-center space-y-3">
          <Button
            onClick={googleSignIn}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50"
          >
            <FcGoogle className="text-xl" />
            <span className="font-medium">Sign in with Google</span>
          </Button>
          {process.env.NODE_ENV === "development" && (
            <Button
              onClick={testUserSignIn}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50"
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
