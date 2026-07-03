import { Server } from "socket.io";

let io;

export function initSocket(httpServer) {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://perplexity-1-5gaq.onrender.com",
      ],
      credentials: true,
    },
  });

  console.log("✅ Socket.io server is running");

  // Handle socket connections
  // socket.id is a unique identifier for each connected client
  // each time a client connects, we log their socket ID and set up a listener for when they disconnect
  io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);

    socket.on("disconnect", () => {
      console.log("A user disconnected: " + socket.id);
    });
  });
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
}
