import { initializeSocketConnection } from "../services/chat.socket";
import {
  sendMessage,
  deleteChat,
  deleteMessage,
  getChats,
  getMessages,
  generateImage,
} from "../services/chat.api";
import {
  setChats,
  setCurrentChatId,
  setIsLoading,
  setError,
  createNewChat,
  addNewMessage,
  setChatMessages,
} from "../chat.slice";
import { useDispatch, useSelector } from "react-redux";

export const useChat = () => {
  const dispatch = useDispatch();
  const chats = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);

  // const refreshChats = async () => {
  //   dispatch(setIsLoading(true));
  //   try {
  //     const data = await getChats();
  //     const chatsMap = {};
  //     data.chats.forEach((chat) => {
  //       chatsMap[chat._id] = {
  //         ...chat,
  //         id: chat._id,
  //         messages: chat.messages || [],
  //       };
  //     });
  //     dispatch(setChats(chatsMap));
  //   } catch (err) {
  //     dispatch(setError(err.message));
  //   } finally {
  //     dispatch(setIsLoading(false));
  //   }
  // };

  // this function will be called when the user clicks on a chat in the sidebar, it will load the messages for that chat and set the current chat id in the state
  const loadMessages = async (chatID) => {
    if (!chatID) return;
    dispatch(setIsLoading(true));
    try {
      const data = await getMessages(chatID);
      const messages = (data.messages || []).map((msg) => ({
        role: msg.role,
        content: msg.content,
        id: msg._id,
      }));
      dispatch(setChatMessages({ chatID, messages }));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  // this function will be called when the user sends a message, it will send the message to the server and update the chat state with the new message
  async function handleSendMessage(chatID, message, webSearch = false) {
    dispatch(setIsLoading(true));
    try {
      const resolvedChatID = chatID && chats[chatID] ? chatID : null;
      const data = await sendMessage({ chatID: resolvedChatID, message, webSearch });
      const { chat, aiMessage, title } = data;

      const activeChatId = resolvedChatID || chat?._id;

      if (!resolvedChatID && chat) {
        // If it was a new chat, create it in state first
        dispatch(
          createNewChat({ chatID: chat._id, title: title || chat.title }),
        );
      }

      dispatch(
        addNewMessage({ chatID: activeChatId, content: message, role: "user" }),
      );

      if (aiMessage) {
        dispatch(
          addNewMessage({
            chatID: activeChatId,
            content: aiMessage.content,
            role: "ai",
          }),
        );
      }
    } catch (err) {
      console.error("Error in handleSendMessage:", err);
      dispatch(setError(err.message));
    } finally {
      dispatch(setIsLoading(false));
    }
  }

  // this function will be called when the user wants to generate an image
  async function handleGenerateImage(chatID, prompt) {
    dispatch(setIsLoading(true));
    try {
      const resolvedChatID = chatID && chats[chatID] ? chatID : null;
      const data = await generateImage({ chatID: resolvedChatID, prompt });
      const { chat, aiMessage, title } = data;

      const activeChatId = resolvedChatID || chat?._id;

      if (!resolvedChatID && chat) {
        dispatch(
          createNewChat({ chatID: chat._id, title: title || chat.title }),
        );
      }

      dispatch(
        addNewMessage({
          chatID: activeChatId,
          content: `Generate image: ${prompt}`,
          role: "user",
        }),
      );

      if (aiMessage) {
        dispatch(
          addNewMessage({
            chatID: activeChatId,
            content: aiMessage.content,
            role: "ai",
          }),
        );
      }
    } catch (err) {
      console.error("Error in handleGenerateImage:", err);
      dispatch(setError(err.message));
    } finally {
      dispatch(setIsLoading(false));
    }
  }

  async function handleGetChats() {
    dispatch(setIsLoading(true));
    const data = await getChats();
    const { chats } = data;
    const chatsMap = chats.reduce((acc, chat) => {
      acc[chat._id] = {
        id: chat._id,
        title: chat.title,
        messages: [],
        lastUpdated: chat.updatedAt,
      };
      return acc;
    }, {});
    dispatch(setChats(chatsMap));
    if (currentChatId && !chatsMap[currentChatId]) {
      dispatch(setCurrentChatId(null));
    }
    dispatch(setIsLoading(false));
  }

  async function handleDeleteChat(chatID) {
    dispatch(setIsLoading(true));
    try {
      await deleteChat(chatID);
      await handleGetChats();
      if (currentChatId === chatID) {
        dispatch(setCurrentChatId(null));
      }
    } catch (err) {
      console.error("Error in handleDeleteChat:", err);
      dispatch(setError(err.message));
    } finally {
      dispatch(setIsLoading(false));
    }
  }

  async function handleDeleteMessage(chatID, messageID) {
    dispatch(setIsLoading(true));
    try {
      await deleteMessage(chatID, messageID);
      await loadMessages(chatID);
    } catch (err) {
      console.error("Error in handleDeleteMessage:", err);
      dispatch(setError(err.message));
    } finally {
      dispatch(setIsLoading(false));
    }
  }

  return {
    initializeSocketConnection,
    handleSendMessage,
    handleGenerateImage,
    handleDeleteChat,
    handleDeleteMessage,
    // refreshChats,
    loadMessages,
    handleGetChats,
  };
};



