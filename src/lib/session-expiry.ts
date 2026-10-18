"use client";

import axios from "axios";
import { signOut } from "./auth-client";

/**
 * Sends the user to /login when one of our /api/* routes answers 401.
 *
 * The routes return 401 when the session has no usable access token, e.g.
 * after the Keycloak SSO session expired. Without this every page would just
 * show a load error. Installed once for all fetch and axios calls, so pages
 * need no handling of their own.
 */

let installed = false;
let redirecting = false;

function isOwnApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return (
      parsed.origin === window.location.origin &&
      parsed.pathname.startsWith("/api/") &&
      // better-auth's own endpoints handle their own 401s.
      !parsed.pathname.startsWith("/api/auth/")
    );
  } catch {
    return false;
  }
}

async function redirectToLogin() {
  if (redirecting) return;
  redirecting = true;
  try {
    // Clear the stale better-auth session, or /login would see it as valid.
    await signOut();
  } catch {
    // Go to /login regardless.
  } finally {
    window.location.href = "/login";
  }
}

export function installSessionExpiryRedirect() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (response.status === 401 && isOwnApiUrl(url)) {
      void redirectToLogin();
    }
    return response;
  };

  axios.interceptors.response.use(undefined, (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      isOwnApiUrl(error.config?.url ?? "")
    ) {
      void redirectToLogin();
    }
    return Promise.reject(error);
  });
}

// Install on module load, before any page component fetches.
installSessionExpiryRedirect();
