import { useEffect, useRef } from "react";
import { useArenaStore } from "../lib/store";
import type { ServerViewerMessage } from "../lib/types";

/** Derive the spectator WS URL from the current page origin. */
function getWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/spectator`;
}

/**
 * Connects to the arena server's spectator WebSocket.
 * Automatically reconnects on disconnect with exponential backoff.
 */
export function useMatchSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const { setConnected, updateState, setMatchEnd, updateLobby, reset } = useArenaStore();

  useEffect(() => {
    let unmounted = false;
    const url = getWsUrl();

    function getBackoffMs() {
      return Math.min(1000 * Math.pow(2, retryCount.current), 15000);
    }

    function connect() {
      if (unmounted) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!unmounted) {
          retryCount.current = 0;
          setConnected(true);
          console.log("[Viewer] Connected to server");
        }
      };

      ws.onmessage = (event) => {
        if (unmounted) return;
        try {
          const msg = JSON.parse(event.data) as ServerViewerMessage;
          if (msg.type === "state") {
            updateState(msg);
          } else if (msg.type === "match_end") {
            setMatchEnd(msg);
          } else if (msg.type === "lobby") {
            updateLobby(msg);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!unmounted) {
          setConnected(false);
          const delay = getBackoffMs();
          retryCount.current = Math.min(retryCount.current + 1, 5);
          console.log(`[Viewer] Disconnected. Reconnecting in ${delay}ms...`);
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      reset();
    };
  }, [setConnected, updateState, setMatchEnd, updateLobby, reset]);
}
