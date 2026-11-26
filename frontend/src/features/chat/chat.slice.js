import { createSlice } from "@reduxjs/toolkit";

const NEW_CHAT_KEY = "__new__";

const initialStreaming = {
  chatId: null,
  text: "",
  stage: null,
  status: "idle", // "idle" | "running" | "cancelling"
};

const initialState = {
  conversations: [],
  messagesByChat: {},
  loadedChats: {},
  activeChatId: null,
  isLoadingChats: false,
  isLoadingMessages: false,
  streaming: { ...initialStreaming },
  error: null,
  attachments: [],
  socketStatus: "disconnected", // "disconnected" | "connecting" | "connected" | "reconnecting"
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSocketStatus: (state, action) => {
      state.socketStatus = action.payload;
    },
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    upsertConversation: (state, action) => {
      const next = action.payload;
      const idx = state.conversations.findIndex((c) => c.id === next.id);
      if (idx >= 0) {
        state.conversations[idx] = { ...state.conversations[idx], ...next };
      } else {
        state.conversations.unshift(next);
      }
    },
    removeConversation: (state, action) => {
      const chatId = action.payload;
      state.conversations = state.conversations.filter((c) => c.id !== chatId);
      delete state.messagesByChat[chatId];
      delete state.loadedChats[chatId];
      if (state.activeChatId === chatId) {
        state.activeChatId = null;
      }
    },
    setActiveChatId: (state, action) => {
      state.activeChatId = action.payload;
    },
    setLoadingChats: (state, action) => {
      state.isLoadingChats = action.payload;
    },
    setLoadingMessages: (state, action) => {
      state.isLoadingMessages = action.payload;
    },
    setMessagesForChat: (state, action) => {
      const { chatId, messages } = action.payload;
      state.messagesByChat[chatId] = messages;
      state.loadedChats[chatId] = true;
    },
    startRun: (state, action) => {
      const { chatId, userMessage } = action.payload;
      const key = chatId || NEW_CHAT_KEY;
      state.error = null;
      state.streaming = {
        chatId: key,
        text: "",
        stage: "preparing",
        status: "running",
      };
      if (!state.messagesByChat[key]) {
        state.messagesByChat[key] = [];
      }
      state.messagesByChat[key].push(userMessage);
      state.attachments = [];
    },
    setRunStage: (state, action) => {
      if (state.streaming.status !== "idle") {
        state.streaming.stage = action.payload;
      }
    },
    appendRunToken: (state, action) => {
      if (state.streaming.status !== "idle") {
        state.streaming.text += action.payload;
      }
    },
    setCancelling: (state) => {
      if (state.streaming.status === "running") {
        state.streaming.status = "cancelling";
      }
    },
    finishRunSuccess: (state, action) => {
      const { chat, title, aiResponse, citations = [] } = action.payload;
      const realChatId = chat._id;

      if (
        state.streaming.chatId === NEW_CHAT_KEY &&
        state.messagesByChat[NEW_CHAT_KEY]
      ) {
        state.messagesByChat[realChatId] = [
          ...(state.messagesByChat[realChatId] || []),
          ...state.messagesByChat[NEW_CHAT_KEY],
        ];
        delete state.messagesByChat[NEW_CHAT_KEY];
      }

      if (!state.messagesByChat[realChatId]) {
        state.messagesByChat[realChatId] = [];
      }

      state.messagesByChat[realChatId].push({
        id: `ai-${Date.now()}`,
        role: "ai",
        content: aiResponse,
        citations,
      });

      state.loadedChats[realChatId] = true;
      state.activeChatId = realChatId;

      const conv = {
        id: realChatId,
        title: title || chat.title || "New chat",
        updatedAt: chat.updatedAt || new Date().toISOString(),
      };
      const idx = state.conversations.findIndex((c) => c.id === realChatId);
      if (idx >= 0) {
        state.conversations[idx] = { ...state.conversations[idx], ...conv };
        const [moved] = state.conversations.splice(idx, 1);
        state.conversations.unshift(moved);
      } else {
        state.conversations.unshift(conv);
      }

      state.streaming = { ...initialStreaming };
    },
    finishRunError: (state, action) => {
      state.error = action.payload;
      state.streaming = { ...initialStreaming };
    },
    finishRunCancelled: (state, action) => {
      const chatId = action.payload?.chatId;
      if (
        chatId &&
        state.streaming.chatId === NEW_CHAT_KEY &&
        state.messagesByChat[NEW_CHAT_KEY]
      ) {
        state.messagesByChat[chatId] = [
          ...(state.messagesByChat[chatId] || []),
          ...state.messagesByChat[NEW_CHAT_KEY],
        ];
        delete state.messagesByChat[NEW_CHAT_KEY];
        state.loadedChats[chatId] = true;
        state.activeChatId = chatId;
      }
      state.streaming = { ...initialStreaming };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearNewChatBuffer: (state) => {
      delete state.messagesByChat[NEW_CHAT_KEY];
    },
    addAttachment: (state, action) => {
      state.attachments.push(action.payload);
    },
    updateAttachment: (state, action) => {
      const { localId, patch } = action.payload;
      const item = state.attachments.find((a) => a.localId === localId);
      if (item) {
        Object.assign(item, patch);
      }
    },
    removeAttachment: (state, action) => {
      state.attachments = state.attachments.filter(
        (a) => a.localId !== action.payload,
      );
    },
    clearAttachments: (state) => {
      state.attachments = [];
    },
    resetChatState: () => ({
      ...initialState,
      streaming: { ...initialStreaming },
    }),
  },
});

export const {
  setSocketStatus,
  setConversations,
  upsertConversation,
  removeConversation,
  setActiveChatId,
  setLoadingChats,
  setLoadingMessages,
  setMessagesForChat,
  startRun,
  setRunStage,
  appendRunToken,
  setCancelling,
  finishRunSuccess,
  finishRunError,
  finishRunCancelled,
  clearError,
  clearNewChatBuffer,
  addAttachment,
  updateAttachment,
  removeAttachment,
  clearAttachments,
  resetChatState,
} = chatSlice.actions;

const EMPTY_MESSAGES = [];

export const selectConversations = (state) => state.chat.conversations;
export const selectActiveChatId = (state) => state.chat.activeChatId;
export const selectActiveMessages = (state) => {
  const key = state.chat.activeChatId || NEW_CHAT_KEY;
  return state.chat.messagesByChat[key] || EMPTY_MESSAGES;
};
export const selectStreaming = (state) => state.chat.streaming;
export const selectChatError = (state) => state.chat.error;
export const selectAttachments = (state) => state.chat.attachments;
export const selectSocketStatus = (state) => state.chat.socketStatus;
export const selectIsLoadingChats = (state) => state.chat.isLoadingChats;
export const selectIsLoadingMessages = (state) => state.chat.isLoadingMessages;
export const selectIsChatLoaded = (chatId) => (state) =>
  Boolean(state.chat.loadedChats[chatId]);

export default chatSlice.reducer;
