/**
 * WebSocket Route Handler
 * Handles WebSocket upgrade requests for chat
 */

import { Context } from 'hono';

export async function handleWebSocketUpgrade(c: Context) {
  // Get upgrade header
  const upgrade = c.req.header('upgrade');

  if (upgrade !== 'websocket') {
    return c.json({ error: 'Expected WebSocket upgrade' }, 400);
  }

  // For Bun, we need to upgrade the connection
  // The actual WebSocket handler will be called in Bun.serve config
  const server = (c as any).env?.server || Bun;

  const success = server.upgrade(c.req.raw, {
    data: {
      request: c.req.raw,
    },
  });

  if (!success) {
    return c.json({ error: 'WebSocket upgrade failed' }, 500);
  }

  return undefined; // Connection upgraded successfully
}
