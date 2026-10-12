import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Plain client-rendered Vite SPA (no TanStack Start/Nitro server layer), so
// `vite build` emits a static dist/index.html deployable to any static host.
//
// VITE_BASE_PATH: set at build time when this is deployed under a fixed,
// non-root path (e.g. a CloudFront behavior serving /lcms-frontend/* from
// this app's own origin/index.html) -- e.g. VITE_BASE_PATH=/lcms-frontend/.
// Vite exposes whatever this resolves to as import.meta.env.BASE_URL, which
// router.tsx reads as the router's own basepath, so the two can never drift
// out of sync. Leave unset for local dev / a root-path deploy (default "/").
export default defineConfig({
  base: process.env["VITE_BASE_PATH"] || "/",
  plugins: [
    // Must run before viteReact() so it can rewrite route files first.
    tanstackRouter({ target: "react", autoCodeSplitting: false }),
    viteReact(),
    tailwindcss(),
    tsConfigPaths(),
  ],
});
