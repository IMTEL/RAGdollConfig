"use client"
import axios from 'axios';
import { signIn, signOut } from 'next-auth/react';

export const testUserSignIn = () => {
  signIn("dev", {
    redirect: true,
    callbackUrl: '/',
  });
};

export const googleSignIn = () => signIn('google', {
      callbackUrl: '/',
    });

export const handleSignOut = async() => {
  const response = await axios.get("/api/logout")

  if (response.status !== 200) {
    alert("An error occured while trying to log out, Response code : " + response.status.toString)
  }
  signOut(({callbackUrl:"/login"}));
}