import axios, { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

import { getSessionToken } from "@/lib/hooks/token";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

export async function POST(req: NextRequest) {
  const sessionToken = await getSessionToken(req);
  if (!sessionToken) {
    return NextResponse.json({ error: "No access token" }, { status: 401 });
  }

  const payload = (await req.json()) as {
    provider?: string;
    apiKey?: string;
  };

  if (!payload?.provider || !payload?.apiKey) {
    return NextResponse.json(
      { error: "Missing required fields: provider and apiKey" },
      { status: 400 }
    );
  }

  try {
    const upstream = await axios.post(
      `${BACKEND_API_URL}/get_embedding_models`,
      {
        provider: payload.provider,
        api_key: payload.apiKey,
      },
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          Accept: "application/json",
        },
      }
    );

    return NextResponse.json(upstream.data, { status: upstream.status });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      const status = axiosError.response?.status ?? 500;
      const detail = axiosError.response?.data?.detail ?? axiosError.message;
      return NextResponse.json({ error: detail }, { status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
