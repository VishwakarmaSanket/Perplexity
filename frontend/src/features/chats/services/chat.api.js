import axios from "axios";

const api = axios.create({
  baseURL: "",  // Requests go through Vite proxy → no CORS/cookie issues
  withCredentials: true,
});

export async function sendMessage({ chatID, message, webSearch }) {
  const response = await api.post("/api/chats/message", { chatID, message, webSearch });
  return response.data;
}

export async function generateImage({ chatID, prompt }) {
  const response = await api.post("/api/chats/generate-image", { chatID, prompt });
  return response.data;
}

export async function getChats() {
  const response = await api.get("/api/chats");
  return response.data;
}

export async function getMessages(chatID) {
  const response = await api.get(`/api/chats/${chatID}/messages`);
  return response.data;
}

export async function deleteChat(chatID) {
  const response = await api.delete(`/api/chats/${chatID}`);
  return response.data;
}

export async function deleteMessage(chatID, messageID) {
  const response = await api.delete(
    `/api/chats/${chatID}/messages/${messageID}`,
  );
  return response.data;
}
