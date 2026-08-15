import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import commonjs from "vite-plugin-commonjs";
import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  define: {},
  plugins: [react(), commonjs()],
  server: {
    host: true, // same as --host, binds to 0.0.0.0
    port: 5183, // optional, default is 5173
  },
});
