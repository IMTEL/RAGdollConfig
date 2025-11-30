import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const APP_BASE_PATH = "/app";
const isAuthRoute = (pathname: string) =>
  pathname.startsWith(`${APP_BASE_PATH}/api/auth`) ||
  pathname === `${APP_BASE_PATH}/login`;

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // Allow auth endpoints and the login page through without forcing a session.
    if (isAuthRoute(pathname)) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: `${APP_BASE_PATH}/login` },
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (isAuthRoute(pathname)) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [`${APP_BASE_PATH}/:path*`],
};
