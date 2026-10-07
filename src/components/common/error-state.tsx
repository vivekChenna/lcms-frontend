import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, isNetworkError } from "@/lib/api/errors";

function messageFor(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return isNetworkError(error) ? "Can't reach the server" : "Something went wrong";
  }
  if (error.isForbidden) return "You don't have access to this";
  if (error.isNotFound) return "Not found";
  return error.message;
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-lg border bg-card px-4 py-12 text-center"
    >
      <AlertTriangle className="mb-3 size-8 text-danger" aria-hidden />
      <p className="max-w-sm break-words font-medium">{messageFor(error)}</p>
      <Button variant="outline" className="mt-4 h-11 lg:h-9" onClick={onRetry}>
        <RotateCw />
        Retry
      </Button>
    </div>
  );
}
