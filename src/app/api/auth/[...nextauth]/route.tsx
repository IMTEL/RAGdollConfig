import axios from "axios";
import NextAuth, { Account, AuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import KeycloakProvider from "next-auth/providers/keycloak";

declare module "next-auth/jwt" {
  interface JWT {
    sessionToken?: string;
    refreshToken?: string;
    sessionTokenExpiry?: number;
    refreshTokenExpiry?: number;
  }
}

export const authOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? "ragdoll-config",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
      issuer:
        process.env.KEYCLOAK_ISSUER ??
        "http://localhost:8080/realms/ragdoll",
    }),
    Credentials({
      id: "dev",
      credentials: {},
      async authorize() {
        if (process.env.NODE_ENV !== "development")
          throw new Error("Can only be used in dev environment");
        return {
          id: "1",
          name: "Dev user",
          email: "dev@example.com",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return await handleLogin(token, account);
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
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? session.user.name;
        session.user.image = token.image ?? session.user.image;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
} as AuthOptions;

function getProviderToken(provider: string, account: Account): string | null {
  switch (provider) {
    case "google":
      return account?.id_token ?? null;
    case "keycloak":
      return account?.id_token ?? account?.access_token ?? null;
    case "dev":
      return "dev";
    default:
      console.error("Provider not recognized");
      return null;
  }
}

interface LoginResponse {
  session_token: string;
  refresh_token: string;
  session_token_ttl: string | number;
  refresh_token_ttl: string | number;
  name?: string | null;
  picture?: string | null;
}

async function handleLogin(token: JWT, account: Account): Promise<JWT> {
  const provider = account.provider;
  const bearer_token = getProviderToken(provider, account);
  const response = await axios.post(
    process.env.BACKEND_API_URL + "/api/login",
    {
      token: bearer_token,
      provider: provider,
    },
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (response.status == 200 && response.data) {
    const data = response.data as LoginResponse;
    token.sessionToken = data.session_token;
    token.refreshToken = data.refresh_token;
    token.sessionTokenExpiry =
      Date.now() + parseInt(String(data.session_token_ttl));
    token.refreshTokenExpiry =
      Date.now() + parseInt(String(data.refresh_token_ttl));
    token.name = data?.name ?? null;
    token.image = data?.picture ?? null;
  } else throw new Error("An error occured when trying to login");

  return token;
}

async function refreshToken(token: JWT): Promise<JWT> {
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
    const data = response.data as Pick<
      LoginResponse,
      "session_token" | "session_token_ttl"
    >;
    token.sessionToken = data.session_token;
    token.sessionTokenExpiry =
      Date.now() + parseInt(String(data.session_token_ttl));
    return token;
  }
  throw new Error(`Failed to refresh token: ${response.status}`);
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
