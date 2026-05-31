"use client";
import axios from "axios";
import { signIn, signOut } from "next-auth/react";

export const keycloakSignIn = () =>
  signIn("keycloak", {
    callbackUrl: "/",
  });

export const keycloakRegister = () =>
  signIn(
    "keycloak",
    {
      callbackUrl: "/",
    },
    {
      kc_action: "register",
    }
  );

export const handleSignOut = async () => {
  try {
    await axios.get("/api/logout");
  } catch (error) {
    console.warn("Backend logout failed; clearing frontend session", error);
  }

  signOut({ callbackUrl: "/login" });
};
