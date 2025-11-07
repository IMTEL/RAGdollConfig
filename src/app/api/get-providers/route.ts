import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSessionToken } from "@/lib/hooks/token";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export async function GET(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken)
    return NextResponse.json({ error: "No access token" }, { status: 401 });

  const upstream = await axios.get(`${BACKEND_API_URL}/providers`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
    },
  });

  const body = await upstream.data;
  return NextResponse.json(body, { status: upstream.status });
}
