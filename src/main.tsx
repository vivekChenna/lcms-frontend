import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";
import { RouterProvider } from "@tanstack/react-router";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { getRouter } from "./router";
import { initTheme } from "./lib/theme";
import "./styles.css";

initTheme();
const router = getRouter();

createRoot(document.getElementById("root")!).render(
  // "user": people who ask their OS for reduced motion get no animation anywhere
  <MotionConfig reducedMotion="user">
    <SkeletonTheme
      baseColor="var(--skeleton-base)"
      highlightColor="var(--skeleton-highlight)"
      duration={1.4}
    >
      <RouterProvider router={router} />
    </SkeletonTheme>
  </MotionConfig>,
);
