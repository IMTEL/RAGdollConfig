import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function getSessionToken(
  req: NextRequest
): Promise<string | null> {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const sessionToken = (token as any)?.sessionToken || null;

    return sessionToken;
  } catch (err) {
    console.error("Failed to get session token:", err);
    return null;
  }
}
