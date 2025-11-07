import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/hooks/token";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export async function GET(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken)
    return NextResponse.json({ error: "No access token" }, { status: 401 });

  const upstream = await axios.get(`${BACKEND_API_URL}/api/logout`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
    },
  });

  return new NextResponse(null, { status: upstream.status });
}
