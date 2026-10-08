import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { initTheme } from "./lib/theme";
import "./styles.css";

initTheme();
const router = getRouter();

createRoot(document.getElementById("root")!).render(
  // "user": people who ask their OS for reduced motion get no animation anywhere
  <MotionConfig reducedMotion="user">
    <RouterProvider router={router} />
  </MotionConfig>,
);
