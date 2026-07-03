import { createSlice } from "@reduxjs/toolkit";

// You can remeber the template as whenever you use redux
// 1. create a slice with createSlice
// 2. export the actions and reducer from the slice
// The state structure is up to you, but a common pattern is to have an object where keys are chat IDs and values are chat objects containing messages and metadata. This allows for easy retrieval and management of multiple chats.
const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: {},
    currentChatId: localStorage.getItem("currentChatId") || null,
    isLoading: false,
    error: null,
  },
  reducers: {
    // This reducer will be called when a new chat is created, it will add the new chat to the state and set the current chat id to the new chat id
    createNewChat(state, action) {
      const { chatID, title } = action.payload;
      state.chats[chatID] = {
        id: chatID,
        title,
        messages: [],
        lastUpdated: new Date().toISOString(),
      };
      state.currentChatId = chatID;
      localStorage.setItem("currentChatId", chatID);
    },
    // This reducer will be called when a new message is added to a chat, it will add the new message to the messages array of the corresponding chat
    addNewMessage(state, action) {
      const { chatID, content, role } = action.payload;
      if (state.chats[chatID]) {
        state.chats[chatID].messages.push({ role, content });
        state.chats[chatID].lastUpdated = new Date().toISOString();
      }
    },
    // This reducer will be called when the messages for a chat are loaded, it will set the messages array of the corresponding chat to the loaded messages
    setChatMessages(state, action) {
      const { chatID, messages } = action.payload;
      if (!state.chats[chatID]) {
        state.chats[chatID] = {
          id: chatID,
          title: "Untitled Chat",
          messages: [],
        };
      }
      state.chats[chatID].messages = messages;
      state.chats[chatID].lastUpdated = new Date().toISOString();
    },
    setChats(state, action) {
      // Preserve any messages already loaded into state to avoid wiping them out during sidebar sync
      const incomingChats = action.payload;
      Object.keys(incomingChats).forEach((id) => {
        if (state.chats[id] && state.chats[id].messages && state.chats[id].messages.length > 0) {
          incomingChats[id].messages = state.chats[id].messages;
        }
      });
      state.chats = incomingChats;
    },
    setCurrentChatId(state, action) {
      state.currentChatId = action.payload;
      if (action.payload) {
        localStorage.setItem("currentChatId", action.payload);
      } else {
        localStorage.removeItem("currentChatId");
      }
    },
    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  setChats,
  setCurrentChatId,
  setIsLoading,
  setError,
  createNewChat,
  addNewMessage,
  setChatMessages,
} = chatSlice.actions;
export default chatSlice.reducer;

// chats = {
//   "docker and AWS": {
//     messages: [
//       { role: "user", text: "What is docker?" },
//       {
//         role: "ai",
//         text: "Docker is a platform that allows developers to automate the deployment of applications inside lightweight, portable containers. It enables you to package an application with all of its dependencies into a standardized unit for software development, making it easier to build, ship, and run applications across different environments.",
//       },
//     ],
//     id: "docker and AWS",
//     lastUpdated: "2025-06-01T12:00:00Z",
//   },
// };
