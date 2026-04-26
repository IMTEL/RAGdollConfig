import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function getSessionToken(
  req: NextRequest
): Promise<string | null> {
  try {
    // In demo mode, the backend skips auth checks, so we can forward a
    // placeholder token and keep the existing route handlers unchanged.
    if (process.env.DISABLE_AUTH === "true") {
      return "demo";
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const sessionToken = (token as any)?.sessionToken || null;

    return sessionToken;
  } catch (err) {
    console.error("Failed to get session token:", err);
    return null;
  }
}
