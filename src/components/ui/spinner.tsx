import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** A spinning loader. Reduced-motion users get a gentle pulse instead of a spin. */
export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      aria-hidden
      className={cn(
        "size-4 animate-spin text-muted-foreground motion-reduce:animate-pulse",
        className,
      )}
    />
  );
}
