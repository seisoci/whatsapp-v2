'use client';

import { AuthProvider } from '@/lib/auth-context';

/**
 * Terminal layout - bypasses AuthGuard to prevent redirect loops
 *
 * The terminal page handles authentication checks manually before
 * initializing the terminal session. This prevents issues where:
 * 1. Echo tries to authorize the private channel
 * 2. If /broadcasting/auth returns 401/403
 * 3. Echo would normally redirect to sign-in
 *
 * By handling auth in the page component, we have better control
 * over the error handling and user experience.
 */
export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
