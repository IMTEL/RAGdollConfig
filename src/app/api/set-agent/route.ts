import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSessionToken } from "@/lib/hooks/token";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

// Creates the agent when the body has no id, otherwise updates it.
export async function POST(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken)
    return NextResponse.json({ error: "No access token" }, { status: 401 });

  const data = await req.json();

  try {
    const upstream = await axios.post(
      data?.id
        ? `${BACKEND_API_URL}/agents/${encodeURIComponent(data.id)}`
        : `${BACKEND_API_URL}/agents`,
      data,
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
    console.error("Failed to save agent:", error);
    return NextResponse.json(
      { error: "Failed to save agent" },
      { status: 500 }
    );
  }
}
