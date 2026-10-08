import { Search } from "lucide-react";
import { forwardRef, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof Input> & {
  /** Show a spinner inside the box: the search is waiting to be sent or is in flight. */
  busy?: boolean | undefined;
  /** A magnifier at the left end of the box. */
  withIcon?: boolean | undefined;
};

/** A text input with a spinner at its right end while a search is pending. Stays editable. */
export const SearchInput = forwardRef<HTMLInputElement, Props>(function SearchInput(
  { busy, withIcon, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      {withIcon && (
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      )}
      <Input ref={ref} className={cn(withIcon && "pl-9", busy && "pr-9", className)} {...props} />
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
