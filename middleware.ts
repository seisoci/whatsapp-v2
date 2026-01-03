import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/auth',
  '/api',
  '/_next',
  '/static',
  '/favicon.ico',
];

// Routes that require authentication
const protectedRoutes = [
  '/',
  '/chat',
  '/users',
  '/roles',
  '/permissions',
  '/role-access',
  '/profile',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Get access token from cookie or check localStorage (will be checked on client-side)
  const accessToken = request.cookies.get('accessToken')?.value;

  // If trying to access protected route without token
  if (!isPublicRoute && !accessToken) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If trying to access sign-in page while authenticated
  if (pathname.startsWith('/sign-in') && accessToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
