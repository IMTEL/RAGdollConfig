import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/hooks/token";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export async function POST(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken) return NextResponse.json({ error: "No access token" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  if (!agentId) return NextResponse.json({ error: "Missing agentId" }, { status: 400 });

  const upstream = await fetch(
    `${BACKEND_API_URL}/upload/agent?agent_id=${agentId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        Accept: "application/json",
        "Content-Type": req.headers.get("content-type") || "", // includes multipart boundary
      },
      body: req.body, // streams through
      duplex: "half"
    } as RequestInit
  );

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}