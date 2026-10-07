import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/** A thin top banner while the browser reports itself offline (navigator.onLine / the
 * online/offline window events) - not a probe of whether the API itself is reachable. */
export function NetworkBanner() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-warning px-4 py-1.5 text-center text-sm font-medium text-warning-foreground"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden />
      You appear to be offline
    </div>
  );
}
