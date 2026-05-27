import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'insecure_development_fallback_secret_key_12345';
const secretKey = new TextEncoder().encode(JWT_SECRET);

const protectedRoutes = ['/dashboard', '/teams', '/tasks', '/payments', '/chat', '/settings', '/analytics', '/workspace'];
const adminOnlyRoutes = ['/dashboard', '/analytics'];
const memberOnlyRoutes = ['/workspace'];
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAuthRoute = authRoutes.some(route => path.startsWith(route));
  const isAdminOnlyRoute = adminOnlyRoutes.some(route => path.startsWith(route));
  const isMemberOnlyRoute = memberOnlyRoutes.some(route => path.startsWith(route));

  // Unauthenticated users cannot access protected routes
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      const status = payload.status as string;
      const role = payload.role as string;

      // Authenticated users on auth pages → redirect to their home
      if (isAuthRoute) {
        if (status === 'PENDING' || status === 'EXPIRED') {
          return NextResponse.redirect(new URL('/payment', request.url));
        }
        return NextResponse.redirect(new URL(role === 'MEMBER' ? '/workspace' : '/dashboard', request.url));
      }

      // Pending/expired users → payment wall
      if (isProtectedRoute && (status === 'PENDING' || status === 'EXPIRED')) {
        return NextResponse.redirect(new URL('/payment', request.url));
      }

      // Members trying to access admin-only routes → redirect to workspace
      if (isAdminOnlyRoute && role === 'MEMBER') {
        return NextResponse.redirect(new URL('/workspace', request.url));
      }

      // Admins/Owners trying to access member-only routes → redirect to dashboard
      if (isMemberOnlyRoute && role !== 'MEMBER') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

    } catch (error) {
      // Invalid token → clear and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
