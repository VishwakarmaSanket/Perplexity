import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,       // Always use 5173 — don't let Vite auto-increment
    strictPort: true, // Error if 5173 is taken (so you know to free it)
    proxy: {
      // Proxy all /api and /public requests to the backend
      // This means cookies are always same-origin → no CORS/cookie issues
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,          // WebSocket proxying for Socket.io
        changeOrigin: true,
      },
      "/public": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
