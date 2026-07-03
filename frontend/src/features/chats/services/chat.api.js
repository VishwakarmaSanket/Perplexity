import api from "../../../api";

export async function sendMessage({ chatID, message, webSearch }) {
  const response = await api.post("/chats/message", { chatID, message, webSearch });
  return response.data;
}

export async function generateImage({ chatID, prompt }) {
  const response = await api.post("/chats/generate-image", { chatID, prompt });
  return response.data;
}

export async function getChats() {
  const response = await api.get("/chats");
  return response.data;
}

export async function getMessages(chatID) {
  const response = await api.get(`/chats/${chatID}/messages`);
  return response.data;
}

export async function deleteChat(chatID) {
  const response = await api.delete(`/chats/${chatID}`);
  return response.data;
}

export async function deleteMessage(chatID, messageID) {
  const response = await api.delete(
    `/chats/${chatID}/messages/${messageID}`,
  );
  return response.data;
}
