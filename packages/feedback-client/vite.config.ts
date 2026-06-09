import { defineConfig } from "vite";

// Builds the entire feedback UI (React included) into one self-contained IIFE
// that the Vite plugin injects into host apps.
export default defineConfig({
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    target: "es2020",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: "src/main.tsx",
      name: "DesignFeedback",
      formats: ["iife"],
      fileName: () => "feedback-client.iife.js",
    },
  },
});
