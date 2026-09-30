import { betterAuth } from "better-auth";
import { genericOAuth, keycloak, jwt } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    genericOAuth({
      config: [
        keycloak({
          clientId: process.env.KEYCLOAK_CLIENT_ID ?? "ragdoll-config",
          clientSecret:
            process.env.KEYCLOAK_CLIENT_SECRET ?? "ragdoll-config-secret",
          issuer:
            process.env.KEYCLOAK_ISSUER ??
            "http://localhost:8080/realms/ragdoll",
          postLogoutRedirectURI: "/login",
        }),
      ],
    }),
  ],
});
