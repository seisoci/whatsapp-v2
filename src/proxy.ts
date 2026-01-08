import { NextResponse, type NextRequest } from 'next/server';

const protectedRoutes = [
  '/',
  '/executive',
  '/financial',
  '/analytics',
  '/logistics',
  '/ecommerce',
  '/support',
  '/file',
  '/file-manager',
  '/invoice',
  '/forms/profile-settings',
];

const publicRoutes = ['/sign-in', '/sign-up', '/forgot-password'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
