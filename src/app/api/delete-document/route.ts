import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/hooks/token";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export async function GET(req: NextRequest) {

  const sessionToken = await getSessionToken(req);
  if (!sessionToken) return NextResponse.json({ error: "No access token" }, { status: 401 });
  

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  const documentId = searchParams.get("documentId");

  const upstream = await axios.delete(`${BACKEND_API_URL}/documents/`, {
    params: {document_id: documentId, agent_id: agentId},
    headers: { Authorization: `Bearer ${sessionToken}`, Accept: "application/json"},
  });

  const body = await upstream.data;
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
