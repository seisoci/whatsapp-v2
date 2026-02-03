'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Loader from '@/components/ui/loader';

const publicPaths = [
  '/sign-in',
  '/auth/sign-in-1',
  '/auth/sign-in-2',
  '/auth/sign-in-3',
  '/auth/sign-in-4',
  '/auth/sign-in-5',
  '/auth/sign-up-1',
  '/auth/sign-up-2',
  '/auth/sign-up-3',
  '/auth/sign-up-4',
  '/auth/sign-up-5',
  '/auth/forgot-password-1',
  '/auth/forgot-password-2',
  '/auth/forgot-password-3',
  '/auth/forgot-password-4',
  '/auth/forgot-password-5',
  '/auth/otp-1',
  '/auth/otp-2',
  '/auth/otp-3',
  '/auth/otp-4',
  '/auth/otp-5',
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (publicPaths.some(path => pathname?.startsWith(path))) {
      return;
    }

    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader variant="pulse" size="lg" />
      </div>
    );
  }

  if (publicPaths.some(path => pathname?.startsWith(path))) {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader variant="pulse" size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
