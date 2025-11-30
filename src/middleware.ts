import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const APP_BASE_PATH = "/app";
const isPublicRoute = (pathname: string) =>
  pathname.startsWith(`${APP_BASE_PATH}/api/auth`) ||
  pathname === `${APP_BASE_PATH}/login` ||
  pathname.startsWith(`${APP_BASE_PATH}/_next`) ||
  pathname === `${APP_BASE_PATH}/favicon.ico`;

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: `${APP_BASE_PATH}/login` },
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (isPublicRoute(pathname)) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/app/:path*"],
};
