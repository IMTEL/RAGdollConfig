"use client";
import axios from "axios";
import { signIn, signOut } from "next-auth/react";

const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/app";
const appApi = (path: string) => `${APP_BASE_PATH}${path}`;

export const testUserSignIn = () => {
  signIn("dev", {
    redirect: true,
    callbackUrl: APP_BASE_PATH,
  });
};

export const googleSignIn = () =>
  signIn("google", {
    callbackUrl: APP_BASE_PATH,
  });

export const handleSignOut = async () => {
  const response = await axios.get(appApi("/api/logout"));

  if (response.status !== 200) {
    alert(
      "An error occured while trying to log out, Response code : " +
        response.status.toString
    );
  }
  signOut({ callbackUrl: `${APP_BASE_PATH}/login` });
};
