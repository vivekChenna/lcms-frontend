import { useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * A quick fade when the page changes. Opacity only: no slide, so nothing shifts while the new
 * page lays out. Keyed by pathname, so changing a query string (filters, tabs) does not replay it.
 * Reduced-motion users get no animation (see MotionConfig in main.tsx).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
