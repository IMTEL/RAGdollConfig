import { QueryKey, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { withAuth } from 'next-auth/middleware';


export default withAuth({
  pages: { signIn: '/login' },
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/auth|login).*)'],
};
