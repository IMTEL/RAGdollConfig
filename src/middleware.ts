import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";
import { headers } from "next/headers";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    // API callers get a 401 they can act on (the client redirects to /login);
    // a redirect would hand fetch the login page's HTML instead.
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // protect everything EXCEPT:
    "/((?!login|api/auth|_next|favicon\\.ico|robots\\.txt|sitemap\\.xml|healthz).*)",
  ],
};
