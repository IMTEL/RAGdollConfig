export const authConfig = {
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        path: "/app",
        sameSite: "lax",
        secure: true,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        path: "/app",
        sameSite: "lax",
        secure: true,
      },
    }
  }
}
