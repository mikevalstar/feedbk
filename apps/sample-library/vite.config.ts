import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import designFeedback from "@repo/vite-plugin-design-feedback";

export default defineConfig({
  plugins: [
    // Before react() so the component tagger sees raw JSX and source line numbers.
    designFeedback({
      projectKey: "sample-library",
      apiUrl: "http://localhost:4000",
      enabled: true,
    }),
    react(),
  ],
  server: {
    port: 5173,
  },
});
