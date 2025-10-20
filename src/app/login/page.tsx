"use client";
import { Button } from "@/components/ui/button";
import { googleSignIn, testUserSignIn } from "@/lib/auth";
import { User } from "lucide-react";
import { useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";


import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      console.error(error)
      alert("An error has occured when trying to login, check console for details");
    }
  }, [error]);


  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-80">
        <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Sign in
        </h1>
        <div className="flex flex-col items-center space-y-3">
          <Button
            onClick={googleSignIn}
            className="flex items-center justify-center gap-2 w-full py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            <FcGoogle className="text-xl" />
            <span className="font-medium">Sign in with Google</span>
          </Button>
          {process.env.NODE_ENV === "development" &&
            <Button
              onClick={testUserSignIn}
              className="flex items-center justify-center gap-2 w-full py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
              <User className="text-xl" />
              <span className="font-medium">Test Account</span>
            </Button>
          }

        </div>
      </div>
    </main>
  );
}
