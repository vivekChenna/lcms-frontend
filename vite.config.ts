import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Plain client-rendered Vite SPA (no TanStack Start/Nitro server layer), so
// `vite build` emits a static dist/index.html deployable to any static host.
export default defineConfig({
  plugins: [
    // Must run before viteReact() so it can rewrite route files first.
    tanstackRouter({ target: "react", autoCodeSplitting: false }),
    viteReact(),
    tailwindcss(),
    tsConfigPaths(),
  ],
});
