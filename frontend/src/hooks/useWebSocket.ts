import { useEffect, useRef, useCallback } from 'react';
import { WsEvent } from '../types';

type Handler = (event: WsEvent) => void;

export function useWebSocket(onEvent: Handler) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}`;
    const ws = new WebSocket(url);

    ws.onopen = () => console.log('[WS] Connected');

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as WsEvent;
        handlerRef.current(event);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected — reconnecting in 2s');
      setTimeout(connect, 2000);
    };

    ws.onerror = (err) => console.error('[WS] Error', err);
    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);
}
