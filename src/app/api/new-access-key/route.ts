import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/hooks/token";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export async function GET(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken)
    return NextResponse.json({ error: "No access token" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  const accessKeyName = searchParams.get("accessKeyName");
  const expiryDate = searchParams.get("expiryDate");

  const upstream = await axios.get(`${BACKEND_API_URL}/new-accesskey`, {
    params: { agent_id: agentId, name: accessKeyName, expiry_date: expiryDate },
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
    },
  });

  const body = await upstream.data;
  return NextResponse.json(body, {
    status: upstream.status,
  });
}
