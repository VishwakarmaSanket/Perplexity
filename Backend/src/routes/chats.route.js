import { Router } from "express";
import {
  sendMessage,
  generateImage,
  getChats,
  getMessages,
  deleteChat,
  deleteMessage,
} from "../controllers/chat.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

const chatRouter = Router();

// We need to make sure only logged in / Registered users
// Can send messages, so we will use authUser middleware
chatRouter.post("/message", authUser, sendMessage);
chatRouter.post("/generate-image", authUser, generateImage);

// Get all chats of a user
chatRouter.get("/", authUser, getChats);

// Get all messages of a particular chat
chatRouter.get("/:chatID/messages", authUser, getMessages);

// Delete a chat and all its messages
chatRouter.delete("/:chatID", authUser, deleteChat);

chatRouter.delete(
  "/:chatID/messages/:messageID",
  authUser,
  deleteMessage,
);

export default chatRouter;
