import { useEffect, useState } from "react";
import { useConvex } from "convex/react";

/**
 * Convex keeps a websocket open, so its connection state is a better signal
 * of "can I sync right now" than raw network reachability.
 */
export function useOnlineStatus() {
  const convex = useConvex();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const tick = () => {
      try {
        setOnline(convex.connectionState().isWebSocketConnected);
      } catch {
        setOnline(true);
      }
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, [convex]);

  return online;
}
