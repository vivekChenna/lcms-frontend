import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": "/src" } },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    globals: false,
    include: ["src/**/*.test.{ts,tsx}"],
    // The default 5s is tight for a multi-step form test (several Select interactions plus
    // realistic userEvent typing) once the whole suite runs in parallel under load.
    testTimeout: 15000,
  },
});
