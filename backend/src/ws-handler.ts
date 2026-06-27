import { WebSocket, WebSocketServer } from 'ws';
import { WsEvent } from './types';

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: import('http').Server): WebSocketServer {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] Client connected');
    ws.on('close', () => console.log('[WS] Client disconnected'));
    ws.on('error', (err) => console.error('[WS] Error:', err.message));
  });

  return wss;
}

export function broadcast(event: WsEvent): void {
  if (!wss) return;
  const payload = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
