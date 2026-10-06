import { SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { ResponsiveDialog } from "./responsive-dialog";

type Props = {
  /** Number of filters currently set; shown on the button and enables Clear. */
  activeCount: number;
  onClear: () => void;
  /** Optional: called by Apply before the sheet closes (filters that apply live can omit it). */
  onApply?: () => void;
  children: ReactNode;
};

/** Filters inline from lg; below lg a "Filters (n)" button opens them in a bottom drawer. */
export function FilterSheet({ activeCount, onClear, onApply, children }: Props) {
  const bp = useBreakpoint();
  const [open, setOpen] = useState(false);

  if (bp === "lg" || bp === "xl") {
    return (
      <div className="flex flex-wrap items-end gap-3">
        {children}
        {activeCount > 0 && (
          <Button variant="ghost" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" className="h-11 lg:h-9" onClick={() => setOpen(true)}>
        <SlidersHorizontal />
        {activeCount > 0 ? `Filters (${activeCount})` : "Filters"}
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Filters"
        drawerBelow="lg"
        footer={
          <>
            <Button
              onClick={() => {
                onApply?.();
                setOpen(false);
              }}
            >
              Apply
            </Button>
            <Button variant="outline" disabled={activeCount === 0} onClick={onClear}>
              Clear
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">{children}</div>
      </ResponsiveDialog>
    </>
  );
}
