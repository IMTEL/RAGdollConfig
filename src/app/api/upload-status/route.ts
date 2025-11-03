import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/hooks/token";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export async function GET(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken)
    return NextResponse.json({ error: "No access token" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");
  if (!taskId)
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });

  const upstream = await fetch(`${BACKEND_API_URL}/upload/status/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
    },
  });

  if (!upstream.ok) {
    const error = await upstream.text();
    return NextResponse.json(
      { error: error || "Failed to fetch upload status" },
      { status: upstream.status }
    );
  }

  const data = await upstream.json();
  return NextResponse.json(data, { status: 200 });
}
