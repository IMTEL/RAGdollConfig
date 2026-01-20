import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        if (process.env.DISABLE_AUTH === "true") return true; // demo switch
        return !!token;
      },
    },
  }
);

// this is a temp version to exclude NextAuth + static + health
export const config = {
  matcher: [
    // protect everything EXCEPT:
    "/((?!api/auth|_next|favicon\\.ico|robots\\.txt|sitemap\\.xml|healthz).*)",
  ],
};
