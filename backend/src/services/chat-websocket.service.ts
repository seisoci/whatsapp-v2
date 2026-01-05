/**
 * WebSocket Manager
 * Manages WebSocket connections for real-time chat updates
 * - JWT authentication
 * - Room-based subscriptions (per phone number)
 * - Event broadcasting to all connected clients in room
 */

import { ServerWebSocket } from 'bun';
import { verify } from 'jsonwebtoken';
import { env } from '../config/env';

interface WebSocketClient {
  ws: ServerWebSocket<{ userId: string; rooms: Set<string>; clientId: string }>;
  userId: string;
  rooms: Set<string>; // phoneNumberIds user is subscribed to
}

interface ChatEvent {
  type: 'message:new' | 'message:status' | 'contact:updated' | 'session:expired';
  phoneNumberId: string;
  data: any;
}

export class ChatWebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws: ServerWebSocket<any>, request: Request): void {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Missing authentication token');
      return;
    }

    try {
      // Verify JWT token
      const decoded = verify(token, env.JWT_SECRET) as { userId: string; email: string };

      // Initialize client
      const clientId = `${decoded.userId}-${Date.now()}`;
      ws.data = {
        userId: decoded.userId,
        rooms: new Set(),
        clientId,
      };

      this.clients.set(clientId, {
        ws,
        userId: decoded.userId,
        rooms: new Set(),
      });

      console.log(`✅ WebSocket client connected: ${clientId} (user: ${decoded.userId})`);

      // Send connection success
      ws.send(JSON.stringify({
        type: 'connection:success',
        data: { userId: decoded.userId },
      }));

      // Note: Event listeners are handled by Bun's WebSocket handler in index.ts
      // calling onMessage and onClose methods below

    } catch (error: any) {
      console.error('❌ WebSocket auth failed:', error.message);
      ws.close(4002, 'Invalid token');
    }
  }

  /**
   * Handle incoming message from Bun handler
   */
  onMessage(ws: ServerWebSocket<any>, message: string | Buffer): void {
    const clientId = ws.data?.clientId;
    if (clientId) {
      this.handleMessage(clientId, message);
    }
  }

  /**
   * Handle close event from Bun handler
   */
  onClose(ws: ServerWebSocket<any>): void {
    const clientId = ws.data?.clientId;
    if (clientId) {
      this.handleDisconnect(clientId);
    }
  }

  /**
   * Handle messages from client
   */
  private handleMessage(clientId: string, message: string | Buffer): void {
    try {
      const data = JSON.parse(message.toString());
      const client = this.clients.get(clientId);

      if (!client) return;

      switch (data.type) {
        case 'subscribe':
          // Subscribe to phone number room
          if (data.phoneNumberId) {
            client.rooms.add(data.phoneNumberId);
            console.log(`📡 Client ${clientId} subscribed to room: ${data.phoneNumberId}`);
            
            client.ws.send(JSON.stringify({
              type: 'subscribe:success',
              data: { phoneNumberId: data.phoneNumberId },
            }));
          }
          break;

        case 'unsubscribe':
          // Unsubscribe from phone number room
          if (data.phoneNumberId) {
            client.rooms.delete(data.phoneNumberId);
            console.log(`📡 Client ${clientId} unsubscribed from room: ${data.phoneNumberId}`);
            
            client.ws.send(JSON.stringify({
              type: 'unsubscribe:success',
              data: { phoneNumberId: data.phoneNumberId },
            }));
          }
          break;

        case 'ping':
          // Heartbeat
          client.ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.warn(`⚠️ Unknown message type: ${data.type}`);
      }
    } catch (error: any) {
      console.error('❌ Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`❌ WebSocket client disconnected: ${clientId}`);
      this.clients.delete(clientId);
    }
  }

  /**
   * Broadcast event to all clients in a room (phone number)
   */
  broadcast(phoneNumberId: string, event: Omit<ChatEvent, 'phoneNumberId'>): void {
    const message = JSON.stringify({
      ...event,
      phoneNumberId,
      timestamp: new Date().toISOString(),
    });

    let sentCount = 0;

    this.clients.forEach((client) => {
      // Send to clients subscribed to this phone number
      if (client.rooms.has(phoneNumberId)) {
        try {
          client.ws.send(message);
          sentCount++;
        } catch (error: any) {
          console.error(`❌ Failed to send to client:`, error);
        }
      }
    });

    if (sentCount > 0) {
      console.log(`📢 Broadcast ${event.type} to ${sentCount} client(s) in room ${phoneNumberId}`);
    }
  }

  /**
   * Get connected clients count
   */
  getClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients count for a specific room
   */
  getRoomClientsCount(phoneNumberId: string): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.rooms.has(phoneNumberId)) {
        count++;
      }
    });
    return count;
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    this.clients.forEach((client) => {
      client.ws.close();
    });
    this.clients.clear();
    console.log('🔌 All WebSocket connections closed');
  }
}

// Export singleton instance
export const chatWebSocketManager = new ChatWebSocketManager();
