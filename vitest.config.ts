import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: [
      {
        find: "@/site-content",
        replacement: path.resolve(__dirname, "app/(marketing)/content"),
      },
      {
        find: "@/legacy-content",
        replacement: path.resolve(__dirname, "app/(legacy)/content"),
      },
      { find: "@", replacement: path.resolve(__dirname, ".") },
    ],
  },
});
