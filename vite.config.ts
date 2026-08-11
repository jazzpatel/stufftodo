import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [react()],
  server: {
    host: true, // same as --host, binds to 0.0.0.0
    port: 5183, // optional, default is 5173
  },
});
