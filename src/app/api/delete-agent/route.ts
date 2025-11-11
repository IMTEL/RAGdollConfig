import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/hooks/token";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL;

export async function GET(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken)
    return NextResponse.json({ error: "No access token" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");

  const upstream = await axios.get(`${BACKEND_API_URL}/delete-agent`, {
    params: { agent_id: agentId },
    headers: {
      Authorization: `Bearer ${sessionToken}`
    },
  });

  return new NextResponse(null, {
    status: upstream.status
  });
}
