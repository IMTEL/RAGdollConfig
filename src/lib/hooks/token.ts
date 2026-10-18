import { NextRequest } from "next/server";
import { auth } from "../auth";

/**
 * Returns the Keycloak access token for the request's session, or null.
 *
 * Null when there is no session or the token can't be refreshed (e.g. the
 * Keycloak SSO session expired: better-auth then throws "Failed to get a
 * valid access token"). Routes answer null with 401, which the client turns
 * into a redirect to /login.
 */
export async function getSessionToken(
  req: NextRequest
): Promise<string | null> {
  try {
    const access = await auth.api.getAccessToken({
      headers: req.headers,
      body: {
        useAccountCookie: true,
      },
    });
    return access?.accessToken ?? null;
  } catch (error) {
    // Only the error type: the error may carry token details.
    const kind = error instanceof Error ? error.name : typeof error;
    console.warn(`Could not get an access token for the session (${kind})`);
    return null;
  }
}
