import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSessionToken } from "@/lib/hooks/token";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export async function GET(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken)
    return NextResponse.json({ error: "No access token" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  if (!agentId)
    return NextResponse.json({ error: "Missing agentId" }, { status: 400 });
  const accessKeyId = searchParams.get("accessKeyId");
  if (!accessKeyId)
    return NextResponse.json({ error: "Missing accessKeyId" }, { status: 400 });

  try {
    const upstream = await axios.delete(
      `${BACKEND_API_URL}/agents/${encodeURIComponent(agentId)}/accesskeys/${encodeURIComponent(accessKeyId)}`,
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          Accept: "application/json",
        },
      }
    );
    return NextResponse.json(upstream.data, { status: upstream.status });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }
    console.error("Failed to revoke access key:", error);
    return NextResponse.json(
      { error: "Failed to revoke access key" },
      { status: 500 }
    );
  }
}
