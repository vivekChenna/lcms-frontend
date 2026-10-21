import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// A refetch this fast would otherwise flash the "Refreshing…" state for a few milliseconds,
// so the button stays showing it for at least this long no matter how quick the data comes back.
const MIN_VISIBLE_MS = 2000;

/** Invalidates every cached query, so every screen currently on view refetches its own data. */
export function RefreshButton() {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        qc.invalidateQueries(),
        new Promise((resolve) => setTimeout(resolve, MIN_VISIBLE_MS)),
      ]);
      toast.success("Refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={refreshing ? "Refreshing" : "Refresh"}
      loading={refreshing}
      loadingText="Refreshing…"
      className="h-11 shrink-0 text-primary hover:text-primary lg:h-9"
      onClick={() => void refresh()}
    >
      <RefreshCw aria-hidden />
      Refresh
    </Button>
  );
}
