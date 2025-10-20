import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/hooks/token";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export async function POST(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken) return NextResponse.json({ error: "No access token" }, { status: 401 });
  const data = await req.json();

const upstream = await axios.post(
  `${BACKEND_API_URL}/update-agent`,
  data,
  {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }
);

  const body = await upstream.data;
  return NextResponse.json(body, {
    status: upstream.status
  });
}
