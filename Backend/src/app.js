import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route.js";
import chatRouter from "./routes/chats.route.js";
import morgan from "morgan";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  cors({
    origin: ["http://localhost:5173", "https://perplexity-59tg.onrender.com"],
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.json({
    message: "Server is running",
  });
});

app.use("/public", express.static(path.join(process.cwd(), "public")));

app.use("/api/auth", authRouter);
app.use("/api/chats", chatRouter);

export default app;
