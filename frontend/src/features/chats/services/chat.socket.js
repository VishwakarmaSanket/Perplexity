import { io } from "socket.io-client";

export async function initializeSocketConnection() {
  // Empty string = same origin → goes through Vite proxy (/socket.io)
  const socket = io("/", {
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
