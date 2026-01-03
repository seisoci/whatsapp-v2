'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

/**
 * Higher-order component to protect routes that require authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/sign-in'
) {
  return function ProtectedRoute(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push(redirectTo);
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Higher-order component to protect routes that should only be accessible to guests
 * (e.g., login, register pages)
 */
export function withGuest<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/'
) {
  return function GuestRoute(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && user) {
        router.push(redirectTo);
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (user) {
      return null;
    }

    return <Component {...props} />;
  };
}
