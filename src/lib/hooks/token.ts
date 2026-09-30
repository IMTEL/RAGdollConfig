import { NextRequest } from "next/server";
import { auth } from "../auth";
import { headers } from "next/headers";

export async function getSessionToken(
  req: NextRequest
): Promise<string | null> {
  // In demo mode, the backend skips auth checks, so we can forward a
  // placeholder token and keep the existing route handlers unchanged.
  const access = await auth.api.getAccessToken({
    headers: req.headers,
    body: {
      useAccountCookie: true,
    },
  });
  return access.accessToken;
}
