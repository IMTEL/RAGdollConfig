import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { 
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  // Only protect routes that actually need authentication
  // With basePath="/app", paths in middleware don't include /app prefix
  // Exclude: login page, api/auth (NextAuth), and static files
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
