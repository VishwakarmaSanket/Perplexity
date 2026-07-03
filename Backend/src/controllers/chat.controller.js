// src/controllers/chat.controller.js
import { generateResponse, generateChatTitle } from "../services/ai.service.js";
import { generateGrokImage } from "../services/image.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";

// This function handles the logic for sending a message in a chat conversation. It checks if a chat ID is provided, and if not, it creates a new chat with a generated title based on the user's message. It then saves the user's message to the database, retrieves all messages for the chat, generates a response from the AI model, and saves the AI's response as well. Finally, it returns the chat title, chat details, and AI message in the response.
export async function sendMessage(req, res) {
  try {
    const { message, chatID, webSearch } = req.body;
    console.log(
      "📨 [sendMessage] Received request - chatID:",
      chatID,
      "message:",
      message?.substring(0, 30),
      "webSearch:",
      webSearch
    );

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    let title = null,
      chat = null;

    // If chatID is provided, find the chat and update it with the new message
    // If chatID is not provided, create a new chat with the generated title and message
    if (!chatID) {
      console.log("🆕 [sendMessage] Creating new chat - generating title...");
      title = await generateChatTitle(message);
      console.log("✅ [sendMessage] Title generated:", title);
      chat = await chatModel.create({
        user: req.user.id,
        title,
      });
      console.log("✅ [sendMessage] Chat created with ID:", chat._id);
    }

    const userMessage = await messageModel.create({
      chat: chatID || chat._id,
      content: message,
      role: "user",
      parentMessage: null,
    });
    console.log("✅ [sendMessage] User message created");

    const messages = await messageModel.find({ chat: chatID || chat._id });
    console.log("✅ [sendMessage] Found", messages.length, "messages");

    console.log("🤖 [sendMessage] Calling generateResponse...");
    const result = await generateResponse(messages, webSearch);
    console.log(
      "✅ [sendMessage] Response generated:",
      result?.substring(0, 50),
    );

    const aiMessage = await messageModel.create({
      chat: chatID || chat._id,
      content: result,
      role: "ai",
      parentMessage: userMessage._id,
    });

    console.log(messages);

    res.status(201).json({
      title,
      chat,
      aiMessage,
    });
  } catch (error) {
    console.error("❌ [sendMessage] Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to send message" });
  }
}

// This function handles the logic for generating an image from a text prompt using Grok's image API.
export async function generateImage(req, res) {
  try {
    const { prompt, chatID } = req.body;
    console.log(
      "🎨 [generateImage] Received request - chatID:",
      chatID,
      "prompt:",
      prompt?.substring(0, 30),
    );

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    let title = null,
      chat = null;

    if (!chatID) {
      console.log("🆕 [generateImage] Creating new chat - generating title...");
      title = await generateChatTitle(`Generate image: ${prompt}`);
      chat = await chatModel.create({
        user: req.user.id,
        title,
      });
    }

    const userMessage = await messageModel.create({
      chat: chatID || chat._id,
      content: `Generate image: ${prompt}`,
      role: "user",
      parentMessage: null,
    });

    console.log("🤖 [generateImage] Calling generateGrokImage...");
    const imageUrl = await generateGrokImage(prompt);

    const aiMessage = await messageModel.create({
      chat: chatID || chat._id,
      content: `![Generated Image for: ${prompt}](${imageUrl})`,
      role: "ai",
      parentMessage: userMessage._id,
    });

    res.status(201).json({
      title,
      chat,
      aiMessage,
    });
  } catch (error) {
    console.error("❌ [generateImage] Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}

// Returns all chats of a user
export async function getChats(req, res) {
  const user = req.user;
  try {
    const chats = await chatModel.find({ user: user.id });
    res.status(200).json({
      message: "Chats retrieved successfully",
      chats,
    });
  } catch (error) {
    console.error("❌ [getChats] Error:", error.message);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
}

// Returns all message of a particular chat
export async function getMessages(req, res) {
  const { chatID } = req.params;

  const chat = await chatModel.findOne({
    _id: chatID,
    user: req.user.id,
  });

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  const messages = await messageModel.find({ chat: chatID });

  res.status(200).json({
    message: "Messages retrieved successfully",
    messages,
  });
}

// Deletes a chat and all its messages
export async function deleteChat(req, res) {
  const { chatID } = req.params;

  // First, we check if the chat exists and belongs to the user making the request. If it doesn't exist, we return a 404 error. If it does exist, we proceed to delete the chat and all associated messages from the database. Finally, we return a success message in the response.
  const chat = await chatModel.findOneAndDelete({
    _id: chatID,
    user: req.user.id,
  });

  await messageModel.deleteMany({ chat: chatID });

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  return res.status(200).json({ message: "Chat deleted successfully" });
}

// Delete a message in a chat
export async function deleteMessage(req, res) {
  const { chatID, messageID } = req.params;

  const chat = await chatModel.findOne({
    _id: chatID,
    user: req.user.id,
  });

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  const message = await messageModel.findOneAndDelete({
    _id: messageID,
    chat: chatID,
  });

  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  // If the deleted message is a user message, we also delete its corresponding AI response (if it exists).
  if (message.role === "user") {
    await messageModel.deleteMany({ parentMessage: message._id });
  }

  return res.status(200).json({ message: "Message deleted successfully" });
}
