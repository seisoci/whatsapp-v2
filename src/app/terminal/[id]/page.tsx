'use client';

import { useEffect, useState, use } from 'react';

import Terminal from '@/components/terminal/terminal';
import { closeTerminal, getCsrfCookie } from '@/lib/sanctum-api';
import { Loader } from 'rizzui';
import toast from 'react-hot-toast';



export default function TerminalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [session, setSession] = useState<{
    id: string;
    channelName: string;
    title: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeTerminal = async () => {
      try {

        // Ensure CSRF cookie is available for authentication
        // This is critical for Echo authorization to work
        await getCsrfCookie();

        // Verify we have a valid session cookie by checking if user is authenticated
        // If not authenticated, we should show an error instead of trying to connect
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!userResponse.ok) {
          toast.error('Please login first to access terminal');
          // Redirect to sign in after a short delay
          setTimeout(() => {
            window.location.href = '/sign-in';
          }, 2000);
          return;
        }


        // Try to get session info from sessionStorage
        // This is set by the parent page when openTerminal API is called
        const sessionKey = `terminal-session-${resolvedParams.id}`;
        const sessionInfoStr = sessionStorage.getItem(sessionKey);

        if (!sessionInfoStr) {
          toast.error('Terminal session not found. Please open terminal from OLT page.');
          setTimeout(() => {
            window.close();
          }, 3000);
          return;
        }

        const sessionInfo = JSON.parse(sessionInfoStr) as {
          id: string;
          channelName: string;
          title: string;
          timestamp: number;
        };

        // Validate session info
        if (!sessionInfo.id || !sessionInfo.channelName) {
          toast.error('Invalid terminal session data');
          return;
        }

        setSession({
          id: sessionInfo.id,
          channelName: sessionInfo.channelName,
          title: sessionInfo.title || `Terminal Session ${sessionInfo.id}`,
        });
      } catch (error) {
        toast.error('Failed to initialize terminal session');
      } finally {
        setLoading(false);
      }
    };

    initializeTerminal();
  }, [resolvedParams.id]);

  const handleClose = async () => {
    if (session) {
      try {
        await closeTerminal(session.id);
        toast.success('Terminal closed');
      } catch (error) {
      }
    }
    // Close the tab
    window.close();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Terminal Session Not Found</h1>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-900">
      <Terminal
        sessionId={session.id}
        channelName={session.channelName}
        onClose={handleClose}
      />
    </div>
  );
}
