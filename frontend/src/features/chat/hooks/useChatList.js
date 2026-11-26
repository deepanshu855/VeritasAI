import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { deleteChat, getChats } from "../services/chat.api";
import { disconnectSocket } from "../services/chat.socket";
import {
  clearAttachments,
  clearError,
  clearNewChatBuffer,
  removeConversation,
  resetChatState,
  selectActiveChatId,
  selectConversations,
  selectIsLoadingChats,
  setActiveChatId,
  setConversations,
  setLoadingChats,
} from "../chat.slice";

export function useChatList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { handleLogout } = useAuth();

  const conversations = useSelector(selectConversations);
  const activeChatId = useSelector(selectActiveChatId);
  const isLoadingChats = useSelector(selectIsLoadingChats);
  const userName = useSelector((state) => state.auth.user?.username || "");

  const loadChats = useCallback(async () => {
    dispatch(setLoadingChats(true));
    try {
      const data = await getChats();
      const sorted = (data.chats || [])
        .map((c) => ({
          id: c._id,
          title: c.title || "Untitled",
          updatedAt: c.updatedAt,
        }))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      dispatch(setConversations(sorted));
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      dispatch(setLoadingChats(false));
    }
  }, [dispatch]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const selectChat = useCallback(
    (chatId) => {
      navigate(`/chat/${chatId}`);
    },
    [navigate],
  );

  const startNewChat = useCallback(() => {
    dispatch(clearNewChatBuffer());
    dispatch(clearAttachments());
    dispatch(clearError());
    dispatch(setActiveChatId(null));
    navigate("/chat");
  }, [dispatch, navigate]);

  const removeChat = useCallback(
    async (chatId) => {
      try {
        await deleteChat(chatId);
        dispatch(removeConversation(chatId));
        if (activeChatId === chatId) {
          navigate("/chat");
        }
      } catch (err) {
        console.error("Failed to delete chat:", err);
      }
    },
    [dispatch, activeChatId, navigate],
  );

  const logout = useCallback(async () => {
    await handleLogout();
    disconnectSocket();
    dispatch(resetChatState());
    navigate("/", { replace: true });
  }, [handleLogout, dispatch, navigate]);

  return {
    conversations,
    activeChatId,
    isLoadingChats,
    userName,
    loadChats,
    selectChat,
    startNewChat,
    removeChat,
    logout,
  };
}

