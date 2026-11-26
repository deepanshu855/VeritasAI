import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFileStatus, uploadFile } from "../services/chat.api";
import {
  addAttachment,
  clearAttachments,
  removeAttachment,
  selectAttachments,
  updateAttachment,
} from "../chat.slice";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

export function useFileUpload(chatId) {
  const dispatch = useDispatch();
  const attachments = useSelector(selectAttachments);
  const [validationError, setValidationError] = useState(null);

  const timersRef = useRef(new Map());
  const validationTimerRef = useRef(null);

  const stopPolling = useCallback((localId) => {
    const entry = timersRef.current.get(localId);
    if (entry) {
      clearTimeout(entry.timer);
      timersRef.current.delete(localId);
    }
  }, []);

  const stopAllPolling = useCallback(() => {
    for (const entry of timersRef.current.values()) {
      clearTimeout(entry.timer);
    }
    timersRef.current.clear();
  }, []);

  useEffect(() => {
    stopAllPolling();
    dispatch(clearAttachments());
  }, [chatId, stopAllPolling, dispatch]);

  useEffect(() => {
    return () => {
      stopAllPolling();
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    };
  }, [stopAllPolling]);

  const showValidationError = useCallback((msg) => {
    setValidationError(msg);
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    validationTimerRef.current = setTimeout(() => {
      setValidationError(null);
    }, 4000);
  }, []);

  const pollStatus = useCallback(
    (localId, targetChatId, fileId, startedAt) => {
      const tick = async () => {
        if (!timersRef.current.has(localId)) return;

        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          stopPolling(localId);
          dispatch(
            updateAttachment({
              localId,
              patch: { status: "failed", errorMessage: "Taking too long" },
            }),
          );
          return;
        }

        try {
          const data = await getFileStatus({ chatId: targetChatId, fileId });
          if (!timersRef.current.has(localId)) return;

          const status = data?.file?.status;
          if (status === "ready") {
            stopPolling(localId);
            dispatch(
              updateAttachment({ localId, patch: { status: "ready" } }),
            );
            return;
          }
          if (status === "failed") {
            stopPolling(localId);
            dispatch(
              updateAttachment({
                localId,
                patch: {
                  status: "failed",
                  errorMessage:
                    data?.file?.errorMessage || "File processing failed",
                },
              }),
            );
            return;
          }

          dispatch(
            updateAttachment({
              localId,
              patch: { status: status || "processing" },
            }),
          );
        } catch {
          // Keep polling on transient network errors until timeout
        }

        const timer = setTimeout(tick, POLL_INTERVAL_MS);
        timersRef.current.set(localId, { timer });
      };

      const timer = setTimeout(tick, POLL_INTERVAL_MS);
      timersRef.current.set(localId, { timer });
    },
    [dispatch, stopPolling],
  );

  const addFiles = useCallback(
    async (fileList) => {
      if (!chatId || !fileList?.length) return;

      const incoming = Array.from(fileList);
      let remainingSlots = MAX_FILES - attachments.length;

      if (remainingSlots <= 0) {
        showValidationError("Up to 5 files");
        return;
      }

      for (const file of incoming) {
        if (remainingSlots <= 0) {
          showValidationError("Up to 5 files");
          break;
        }
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          showValidationError("PDF or image only");
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          showValidationError("Max 5 MB per file");
          continue;
        }

        remainingSlots -= 1;
        const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        dispatch(
          addAttachment({
            localId,
            fileId: null,
            originalName: file.name,
            size: file.size,
            mimeType: file.type,
            status: "uploading",
            errorMessage: null,
          }),
        );

        try {
          const data = await uploadFile({ chatId, file });
          const uploaded = data.file;
          const nextStatus =
            uploaded.status === "ready" || uploaded.status === "failed"
              ? uploaded.status
              : "processing";

          dispatch(
            updateAttachment({
              localId,
              patch: {
                fileId: uploaded.fileId,
                status: nextStatus,
              },
            }),
          );

          if (nextStatus === "processing") {
            pollStatus(localId, chatId, uploaded.fileId, Date.now());
          }
        } catch (err) {
          const serverMsg =
            err.response?.data?.message || "Upload failed";
          dispatch(
            updateAttachment({
              localId,
              patch: { status: "failed", errorMessage: serverMsg },
            }),
          );
        }
      }
    },
    [chatId, attachments.length, dispatch, pollStatus, showValidationError],
  );

  const removeFile = useCallback(
    (localId) => {
      stopPolling(localId);
      dispatch(removeAttachment(localId));
    },
    [stopPolling, dispatch],
  );

  const hasPendingOrFailed = attachments.some(
    (a) =>
      a.status === "uploading" ||
      a.status === "processing" ||
      a.status === "failed",
  );

  return {
    attachments,
    validationError,
    hasPendingOrFailed,
    addFiles,
    removeFile,
  };
}

