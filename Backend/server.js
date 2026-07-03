import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import http from "http";
import { initSocket } from "./src/sockets/server.socket.js";

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 8000;

connectDB().catch((err) => {
  console.error("MongoDB connection failed:", err);
});

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
