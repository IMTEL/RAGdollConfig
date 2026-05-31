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

  try {
    const upstream = await axios.get(
      `${BACKEND_API_URL}/agents/${agentId}/collaborators`,
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
    return NextResponse.json(
      { error: "Failed to fetch collaborators" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken)
    return NextResponse.json({ error: "No access token" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  if (!agentId)
    return NextResponse.json({ error: "Missing agentId" }, { status: 400 });

  const body = await req.json();

  try {
    const upstream = await axios.post(
      `${BACKEND_API_URL}/agents/${agentId}/collaborators`,
      body,
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
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
    return NextResponse.json(
      { error: "Failed to add collaborator" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken)
    return NextResponse.json({ error: "No access token" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  const userId = searchParams.get("userId");
  if (!agentId || !userId) {
    return NextResponse.json(
      { error: "Missing agentId or userId" },
      { status: 400 }
    );
  }

  try {
    const upstream = await axios.delete(
      `${BACKEND_API_URL}/agents/${agentId}/collaborators/${userId}`,
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
    return NextResponse.json(
      { error: "Failed to remove collaborator" },
      { status: 500 }
    );
  }
}
