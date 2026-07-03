import { io } from "socket.io-client";

export async function initializeSocketConnection() {
  const socket = io(import.meta.env.VITE_API_URL, {
    withCredentials: true,
  });
  socket.on("connect", () => {
    console.log("✅ Connected to Socket.io server");
  });
  socket.on("disconnect", () => {
    console.log("❌ Disconnected from Socket.io server");
  });
  return socket;
}
