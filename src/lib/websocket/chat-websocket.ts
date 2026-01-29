/**
 * Chat WebSocket Client
 * Real-time communication for chat updates
 */

import { getAccessToken, refreshAccessToken } from '@/lib/api-client';

export type ChatEvent =
  | { type: 'connection:success'; data: { userId: string } }
  | { type: 'connection:reconnected'; data: {} }
  | { type: 'subscribe:success'; data: { phoneNumberId: string } }
  | { type: 'unsubscribe:success'; data: { phoneNumberId: string } }
  | { type: 'message:new'; phoneNumberId: string; data: { contactId: string; message: any } }
  | { type: 'message:status'; phoneNumberId: string; data: { contactId: string; messageId: string; wamid: string; status: string; timestamp: string } }
  | { type: 'contact:updated'; phoneNumberId: string; data: { contactId: string } }
  | { type: 'session:expired'; phoneNumberId: string; data: { contactId: string } }
  | { type: 'pong' };

type EventListener = (event: ChatEvent) => void;

export class ChatWebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionalClose = false;
  private subscribedRooms: Set<string> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private hasConnectedBefore = false;

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = getAccessToken();
        if (!token) {
          reject(new Error('No authentication token'));
          return;
        }

        // Use WSS for production (https) and WS for development (http)
        // IMPORTANT: In production, always use wss:// for encrypted connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
        const wsUrl = `${protocol}//${host}/ws/chat?token=${token}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          const isReconnect = this.hasConnectedBefore;
          this.reconnectAttempts = 0;
          this.isIntentionalClose = false;
          this.hasConnectedBefore = true;

          // Resubscribe to previously subscribed rooms
          this.subscribedRooms.forEach(phoneNumberId => {
            this.subscribe(phoneNumberId);
          });

          // Start ping/pong heartbeat
          this.startHeartbeat();

          // Emit reconnected event so UI can sync missed data
          if (isReconnect) {
            this.emit('connection:reconnected', { type: 'connection:reconnected', data: {} });
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as ChatEvent;
            this.emit(data.type, data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = async (event) => {
          this.stopHeartbeat();

           // Check for auth failure (4001: Missing token, 4002: Invalid/Expired token)
           if (event.code === 4001 || event.code === 4002) {
            console.log('🔄 WebSocket auth failed, attempting to refresh token...');
            try {
               const newToken = await refreshAccessToken();
               if (newToken) {
                  console.log('✅ Token refreshed, reconnecting WebSocket...');
                  this.reconnectAttempts = 0; // Reset attempts
                  this.connect(); // Immediate reconnect
                  return; // prevent standard scheduleReconnect
               } else {
                  console.error('❌ Failed to refresh token for WebSocket');
                  this.emit('session:expired', { type: 'session:expired', phoneNumberId: 'system', data: { contactId: 'system' } });
               }
            } catch (e) {
               console.error('❌ Error refreshing token:', e);
            }
         }

          // Auto-reconnect unless intentionally closed
          if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to phone number room
   */
  subscribe(phoneNumberId: string): void {
    this.subscribedRooms.add(phoneNumberId);
    this.send({
      type: 'subscribe',
      phoneNumberId,
    });
  }

  /**
   * Unsubscribe from phone number room
   */
  unsubscribe(phoneNumberId: string): void {
    this.subscribedRooms.delete(phoneNumberId);
    this.send({
      type: 'unsubscribe',
      phoneNumberId,
    });
  }

  /**
   * Add event listener
   */
  on(event: ChatEvent['type'] | '*', listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: ChatEvent['type'] | '*', listener: EventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  /**
   * Send message to server
   */
  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send:', data);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: ChatEvent['type'], data: ChatEvent): void {
    // Specific event listeners
    this.listeners.get(event)?.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });

    // Wildcard listeners
    this.listeners.get('*')?.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in wildcard listener:', error);
      }
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Start heartbeat ping/pong
   */
  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const chatWebSocket = new ChatWebSocketClient();
