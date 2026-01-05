/**
 * WebSocket Route Handler
 * Handles WebSocket upgrade requests for chat
 */

import { Context } from 'hono';
import { chatWebSocketManager } from '../services/chat-websocket.service';

export async function handleWebSocketUpgrade(c: Context) {
  // Get upgrade header
  const upgrade = c.req.header('upgrade');
  
  if (upgrade !== 'websocket') {
    return c.json({ error: 'Expected WebSocket upgrade' }, 400);
  }

  // Upgrade connection
  const success = c.env?.server?.upgrade(c.req.raw);

  if (!success) {
    return c.json({ error: 'WebSocket upgrade failed' }, 500);
  }

  return undefined; // Connection will be handled by WebSocket manager
}
