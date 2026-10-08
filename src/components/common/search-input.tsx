import { forwardRef, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof Input> & {
  /** Show a spinner inside the box: the search is waiting to be sent or is in flight. */
  busy?: boolean | undefined;
};

/** A text input with a spinner at its right end while a search is pending. Stays editable. */
export const SearchInput = forwardRef<HTMLInputElement, Props>(function SearchInput(
  { busy, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <Input ref={ref} className={cn(busy && "pr-9", className)} {...props} />
      {busy && (
        <span
          role="status"
          aria-label="Searching"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
        >
          <Spinner />
        </span>
      )}
    </div>
  );
});
