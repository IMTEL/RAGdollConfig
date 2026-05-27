"use client";
import axios from "axios";
import { signIn, signOut } from "next-auth/react";

const backend_api_url = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export const testUserSignIn = () => {
  signIn("dev", {
    redirect: true,
    callbackUrl: "/",
  });
};

export const googleSignIn = () =>
  signIn("google", {
    callbackUrl: "/",
  });

export const handleSignOut = async () => {
  const response = await axios.post(`${backend_api_url}/logout`);

  if (response.status !== 200) {
    alert(
      "An error occured while trying to log out, Response code : " +
        response.status.toString
    );
  }
  signOut({ callbackUrl: "/login" });
};
