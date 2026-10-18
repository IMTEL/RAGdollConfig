import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSessionToken } from "@/lib/hooks/token";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

// The response (AccessKeyCreated) is the only time the plaintext key is sent.
export async function GET(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken)
    return NextResponse.json({ error: "No access token" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  if (!agentId)
    return NextResponse.json({ error: "Missing agentId" }, { status: 400 });
  const accessKeyName = searchParams.get("accessKeyName");
  const expiryDate = searchParams.get("expiryDate");

  try {
    const upstream = await axios.get(
      `${BACKEND_API_URL}/agents/new-accesskey`,
      {
        params: {
          agent_id: agentId,
          name: accessKeyName,
          expiry_date: expiryDate ?? undefined,
        },
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
    console.error("Failed to create access key:", error);
    return NextResponse.json(
      { error: "Failed to create access key" },
      { status: 500 }
    );
  }
}
