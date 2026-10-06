import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { isMdUp, useBreakpoint } from "@/hooks/use-breakpoint";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Actions; always visible (sticky). A submit button for a form in `children` uses `form="<id>"`. */
  footer?: ReactNode;
  children?: ReactNode;
  /** Width below which the drawer is used: md (default) or lg (the filter sheet). */
  drawerBelow?: "md" | "lg";
};

/** Centered dialog from md up; a bottom drawer below md with a scrolling body and sticky footer. */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  drawerBelow = "md",
}: Props) {
  const bp = useBreakpoint();
  const desktop = drawerBelow === "md" ? isMdUp(bp) : bp === "lg" || bp === "xl";
  const noDescription = description ? {} : { "aria-describedby": undefined };

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          data-variant="dialog"
          // `> button` is the built-in close: a 44px target until lg (tablets are touch too)
          className="flex max-h-[90dvh] w-[calc(100%-2rem)] flex-col gap-0 p-0 sm:max-w-lg [&>button]:right-2 [&>button]:top-2 [&>button]:grid [&>button]:size-11 [&>button]:place-items-center lg:[&>button]:size-9"
          {...noDescription}
        >
          <DialogHeader className="p-6 pb-4 pr-12">
            <DialogTitle className="leading-snug">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">{children}</div>}
          {footer && <DialogFooter className="gap-2 border-t px-6 py-4">{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent data-variant="drawer" className="max-h-[90dvh]" {...noDescription}>
        <DrawerHeader className="text-left">
          <DrawerTitle className="leading-snug">{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>}
        {footer && (
          <DrawerFooter className="sticky bottom-0 border-t bg-background pb-[calc(1rem+env(safe-area-inset-bottom))] [&_button]:min-h-11">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
