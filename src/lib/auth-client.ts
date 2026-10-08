import { createAuthClient } from "better-auth/react";

const client = createAuthClient({});
export default client;
export const { signIn, signOut, useSession } = client;
