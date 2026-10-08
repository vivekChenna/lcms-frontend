import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode };

/**
 * The phone navigation drawer. Radix Dialog supplies the focus trap, Escape, scroll lock and the
 * "dialog" semantics; framer-motion supplies the slide and fade, and keeps the drawer mounted
 * through its exit animation (`forceMount` + `AnimatePresence`).
 */
export function NavDrawer({ open, onOpenChange, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="fixed inset-y-0 left-0 z-50 w-[calc(18rem+env(safe-area-inset-left))] max-w-[85vw] border-r border-sidebar-border bg-sidebar p-0 pl-[env(safe-area-inset-left)] text-sidebar-foreground shadow-xl outline-none"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                {children}
                <Dialog.Close
                  aria-label="Close"
                  className="absolute right-1.5 top-1.5 grid size-11 place-items-center rounded-md text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <X className="size-5" aria-hidden />
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
