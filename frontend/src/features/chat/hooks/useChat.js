import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMessages } from "../services/chat.api";
import { cancelChatRun, sendChatMessage } from "../services/chat.socket";
import {
  clearError,
  selectActiveChatId,
  selectActiveMessages,
  selectAttachments,
  selectChatError,
  selectIsChatLoaded,
  selectIsLoadingMessages,
  selectSocketStatus,
  selectStreaming,
  setActiveChatId,
  setCancelling,
  setLoadingMessages,
  setMessagesForChat,
  startRun,
} from "../chat.slice";

const STAGE_LABELS = {
  preparing: "Thinking",
  routing: "Thinking",
  searching_docs: "Reading your documents",
  searching_web: "Searching the web",
  writing: "Writing",
};

export function useChat(routeChatId = null) {
  const dispatch = useDispatch();
  const activeChatId = useSelector(selectActiveChatId);
  const messages = useSelector(selectActiveMessages);
  const streaming = useSelector(selectStreaming);
  const error = useSelector(selectChatError);
  const attachments = useSelector(selectAttachments);
  const socketStatus = useSelector(selectSocketStatus);
  const isLoadingMessages = useSelector(selectIsLoadingMessages);
  const isChatLoaded = useSelector(selectIsChatLoaded(routeChatId));

  useEffect(() => {
    const normalized = routeChatId || null;
    if (activeChatId !== normalized) {
      dispatch(setActiveChatId(normalized));
      dispatch(clearError());
    }
  }, [routeChatId, activeChatId, dispatch]);

  useEffect(() => {
    if (!routeChatId || isChatLoaded) return;

    let cancelled = false;
    const load = async () => {
      dispatch(setLoadingMessages(true));
      try {
        const data = await getMessages(routeChatId);
        if (cancelled) return;
        const formatted = (data.messages || []).map((m) => ({
          id: m._id,
          role: m.role,
          content: m.content || "",
          attachments: m.attachments || [],
          citations: m.citations || [],
        }));
        dispatch(
          setMessagesForChat({ chatId: routeChatId, messages: formatted }),
        );
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load messages:", err);
        }
      } finally {
        if (!cancelled) {
          dispatch(setLoadingMessages(false));
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [routeChatId, isChatLoaded, dispatch]);

  const sendMessage = useCallback(
    (rawText) => {
      const text = (rawText ?? "").trim();
      const readyFiles = attachments.filter((a) => a.status === "ready");
      const hasBusyFiles = attachments.some(
        (a) =>
          a.status === "uploading" ||
          a.status === "processing" ||
          a.status === "failed",
      );

      if (streaming.status !== "idle") return false;
      if (socketStatus !== "connected") return false;
      if (hasBusyFiles) return false;
      if (!text && readyFiles.length === 0) return false;

      const fileIds = readyFiles.map((f) => f.fileId);
      const userMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        attachments: readyFiles.map((f) => ({
          _id: f.fileId,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          status: f.status,
        })),
      };

      dispatch(startRun({ chatId: routeChatId || null, userMessage }));
      sendChatMessage({
        message: text,
        chatId: routeChatId || undefined,
        fileIds,
      });
      return true;
    },
    [attachments, streaming.status, socketStatus, routeChatId, dispatch],
  );

  const cancelRun = useCallback(() => {
    if (streaming.status !== "running") return;
    dispatch(setCancelling());
    cancelChatRun();
  }, [streaming.status, dispatch]);

  const dismissError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const isRunning = streaming.status !== "idle";
  const stageLabel = streaming.stage
    ? STAGE_LABELS[streaming.stage] || "Thinking"
    : null;

  return {
    activeChatId,
    messages,
    streaming,
    stageLabel,
    isRunning,
    error,
    socketStatus,
    isLoadingMessages,
    sendMessage,
    cancelRun,
    dismissError,
  };
}
