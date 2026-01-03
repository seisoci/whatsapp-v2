import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { routes } from '@/config/routes';

if (typeof window !== 'undefined') {
  (window as any).Pusher = Pusher;
}

let echoInstance: Echo<any> | null = null;

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const name = 'XSRF-TOKEN=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');

  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return decodeURIComponent(cookie.substring(name.length));
    }
  }

  return null;
}

async function ensureCsrfCookie(): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
    });
    console.log('[Echo] CSRF cookie refreshed');
  } catch (error) {
    console.error('[Echo] Failed to fetch CSRF cookie:', error);
  }
}

export function getEcho(): Echo<any> {
  if (echoInstance) {
    console.log('[Echo] Reusing existing Echo instance');
    return echoInstance;
  }

  // Pre-fetch CSRF cookie before creating Echo instance
  if (typeof window !== 'undefined') {
    ensureCsrfCookie().catch(err => {
      console.warn('[Echo] Failed to pre-fetch CSRF cookie:', err);
    });
  }

  console.log('[Echo] Creating new Echo instance', {
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: process.env.NEXT_PUBLIC_REVERB_PORT,
    scheme: process.env.NEXT_PUBLIC_REVERB_SCHEME,
  });

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080'),
    wssPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080'),
    forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === 'wss',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Accept: 'application/json',
      },
    },
    authorizer: (channel: any) => {
      return {
        authorize: async (socketId: string, callback: Function) => {
          // Ensure CSRF cookie is set before authorization
          await ensureCsrfCookie();

          // Get fresh CSRF token for each authorization attempt
          const freshCsrfToken = getCsrfTokenFromCookie();

          console.log('[Echo] Authorizing channel:', channel.name, 'Socket ID:', socketId, 'Has CSRF:', !!freshCsrfToken);

          fetch(`${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'X-XSRF-TOKEN': freshCsrfToken || '',
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then((response) => {
              console.log('[Echo] Authorization response status:', response.status);

              if (response.status === 401 || response.status === 403) {
                console.warn('[Echo] Unauthenticated - status:', response.status);

                // Only redirect if we're NOT on the terminal page
                // Terminal page should handle auth errors gracefully
                if (typeof window !== 'undefined') {
                  const isTerminalPage = window.location.pathname.startsWith('/terminal');
                  if (!isTerminalPage) {
                    console.warn('[Echo] Redirecting to login');
                    window.location.href = routes.signIn;
                  } else {
                    console.warn('[Echo] Terminal page - not redirecting, letting component handle error');
                  }
                }
                throw new Error(`Unauthenticated - status ${response.status}`);
              }

              if (!response.ok) {
                throw new Error(`Authorization failed with status ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              console.log('[Echo] ✅ Authorization successful for:', channel.name);
              callback(null, data);
            })
            .catch((error) => {
              console.error('[Echo] ❌ Authorization failed:', error);
              callback(error, null);
            });
        },
      };
    },
  });

  if (echoInstance.connector?.pusher) {
    const pusher = echoInstance.connector.pusher;

    pusher.connection.bind('connecting', () => {
      console.log('[Echo/Pusher] Connecting to WebSocket...');
    });

    pusher.connection.bind('connected', () => {
      console.log('[Echo/Pusher] ✅ Connected to WebSocket');
    });

    pusher.connection.bind('disconnected', () => {
      console.log('[Echo/Pusher] Disconnected from WebSocket');
    });

    pusher.connection.bind('error', (err: any) => {
      console.error('[Echo/Pusher] ❌ Connection error:', err);
    });

    pusher.connection.bind('failed', () => {
      console.error('[Echo/Pusher] ❌ Connection failed');
    });
  }

  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
