import LoadingSkeleton from "react-loading-skeleton";
import { cn } from "@/lib/utils";

/**
 * A placeholder block with the shimmer sweep (react-loading-skeleton). Size and shape it with
 * classes, as with any div: `<Skeleton className="h-4 w-1/2" />`, `rounded-full` for a pill.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div aria-hidden className={cn("block leading-none", className)} {...props}>
      <LoadingSkeleton
        containerClassName="block h-full w-full"
        className="!block !h-full !w-full !rounded-[inherit]"
      />
    </div>
  );
}

export { Skeleton };
