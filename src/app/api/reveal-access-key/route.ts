import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSessionToken } from "@/lib/hooks/token";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

// Shows a key created with "allow showing again" ({ key }). Only the agent's
// owner and collaborators may do this; the backend answers 409 for view-once
// keys and for keys that can no longer be decrypted.
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
    const upstream = await axios.get(
      `${BACKEND_API_URL}/agents/${encodeURIComponent(agentId)}/accesskeys/${encodeURIComponent(accessKeyId)}/reveal`,
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          Accept: "application/json",
        },
      }
    );
    return NextResponse.json(upstream.data, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }
    console.error("Failed to reveal access key:", error);
    return NextResponse.json(
      { error: "Failed to reveal access key" },
      { status: 500 }
    );
  }
}
