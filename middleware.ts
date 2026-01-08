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
  '/logo-itn-with-name.svg',
  '/logo-itn.svg',
];


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1';

interface RefreshTokenResponse {
  success: boolean;
  data?: {
    accessToken: string;
  };
  message?: string;
}

/**
 * Try to refresh the access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}${API_PREFIX}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as RefreshTokenResponse;

    if (data.success && data.data?.accessToken) {
      return data.data.accessToken;
    }

    return null;
  } catch (error) {
    console.error('Token refresh failed in middleware:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public or is a static file (image)
  const isPublicRoute = 
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(pathname);

  // Skip middleware for public routes (except sign-in check)
  if (isPublicRoute && !pathname.startsWith('/sign-in')) {
    return NextResponse.next();
  }

  // Get tokens from cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // If trying to access sign-in page while authenticated
  if (pathname.startsWith('/sign-in') && accessToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If accessing protected route
  if (!isPublicRoute) {
    // If no access token but has refresh token, try to refresh
    if (!accessToken && refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);

      if (newAccessToken) {
        // Create response and set new access token cookie
        const response = NextResponse.next();
        response.cookies.set('accessToken', newAccessToken, {
          path: '/',
          maxAge: 15 * 60, // 15 minutes
          httpOnly: false, // Allow JavaScript access for API calls
          sameSite: 'lax',
        });
        return response;
      }
    }

    // If no valid tokens at all, redirect to sign-in
    if (!accessToken && !refreshToken) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(signInUrl);
    }
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
