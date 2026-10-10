import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";
import { RouterProvider } from "@tanstack/react-router";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { getRouter } from "./router";
import { hideSplash, hideSplashAfterMinimum } from "./lib/splash";
import { initTheme } from "./lib/theme";
import "./styles.css";

initTheme();
const router = getRouter();

// The splash screen in index.html stays up until the first page has resolved (this includes the
// session check), so a refresh shows the animation instead of a blank screen. The timeout is a
// safety net: whatever happens, the splash never stays on top of the app.
const stopWaiting = router.subscribe("onResolved", () => {
  stopWaiting();
  hideSplashAfterMinimum();
});
window.setTimeout(hideSplash, 10_000);

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
