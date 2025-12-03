import axios from "axios";
import NextAuth, { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { authConfig } from "@/auth.config";

declare module "next-auth/jwt" {
  interface JWT {
    sessionToken?: string;
    refreshToken?: string;
    sessionTokenExpiry?: number;
    refreshTokenExpiry?: number;
  }
}

export const authOptions = {
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      id: "dev",
      credentials: {},
      async authorize(_, req) {
        if (process.env.NEXT_PUBLIC_ENABLE_TEST_USER !== "true")
          throw new Error("Test user is disabled");
        return {
          id: "1",
          name: "Dev user",
          email: "dev@example.com",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        return await handleLogin(token, account, user);
      }

      if (!token.refreshToken || !token.refreshTokenExpiry)
        throw new Error(`Failed to fetch information about refreshtoken`);
      if (!token.sessionToken || !token.sessionTokenExpiry)
        throw new Error(`Failed to fetch information about sessionToken`);

      if (Date.now() > token.sessionTokenExpiry) {
        if (Date.now() > token.refreshTokenExpiry)
          throw new Error("Refresh token has expired");

        return await refreshToken(token);
      }
      return token;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
} as AuthOptions;

function getProviderToken(provider: string, account: any): string | null {
  switch (provider) {
    case "google":
      return account?.id_token ?? null;
    case "dev":
      return "dev";
    default:
      console.error("Provider not recognized");
      return null;
  }
}

async function handleLogin(token: any, account: any, user: any): Promise<any> {
  const provider = account.provider;
  const bearer_token = getProviderToken(provider, account);
  const response = await axios.post(
    process.env.BACKEND_API_URL + "/login",
    {
      token: bearer_token,
      provider: provider,
    },
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (response.status == 200 && response.data) {
    const data: any = response.data;
    token.sessionToken = data.session_token;
    token.refreshToken = data.refresh_token;
    token.sessionTokenExpiry = Date.now() + parseInt(data.session_token_ttl);
    token.refreshTokenExpiry = Date.now() + parseInt(data.refresh_token_ttl);
    token.name = data?.name ?? null;
    token.image = data?.picture ?? null;
  } else throw new Error("An error occured when trying to login");

  return token;
}

async function refreshToken(token: any): Promise<any> {
  const response = await axios.post(
    `${process.env.BACKEND_API_URL}/api/refresh`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token.refreshToken}`,
      },
    }
  );

  if (response.status == 200 && response.data?.session_token) {
    const data = await response.data;
    token.sessionToken = data.session_token;
    token.sessionTokenExpiry = Date.now() + parseInt(data.session_token_ttl);
    return token;
  }
  throw new Error(`Failed to refresh token: ${response.status}`);
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
