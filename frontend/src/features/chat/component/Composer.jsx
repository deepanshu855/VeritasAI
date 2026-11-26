import { useRef } from "react";
import {
  ArrowUp,
  Check,
  FileText,
  Paperclip,
  Square,
  X,
} from "lucide-react";
import { useAutoGrow } from "../hooks/useAutoGrow";
import { ALLOWED_MIME_TYPES } from "../hooks/useFileUpload";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateName(name, max = 22) {
  if (!name || name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 && name.length - dot <= 5 ? name.slice(dot) : "";
  const keep = Math.max(4, max - ext.length - 1);
  return `${name.slice(0, keep)}…${ext}`;
}

export default function Composer({
  value = "",
  onChange,
  onSubmit,
  onCancel,
  isRunning = false,
  isCancelling = false,
  isConnected = true,
  canAttach = false,
  attachments = [],
  validationError = null,
  hasPendingOrFailed = false,
  onAddFiles,
  onRemoveFile,
}) {
  const textareaRef = useAutoGrow(value);
  const fileInputRef = useRef(null);

  const hasReadyFile = attachments.some((a) => a.status === "ready");
  const hasContent = value.trim().length > 0 || hasReadyFile;
  const canSend =
    !isRunning && isConnected && !hasPendingOrFailed && hasContent;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit?.();
    }
  };

  return (
    <form
      className="vchat-composer"
      onSubmit={(e) => {
        e.preventDefault();
        if (isRunning) {
          if (!isCancelling) onCancel?.();
          return;
        }
        if (canSend) onSubmit?.();
      }}
    >
      {attachments.length > 0 && (
        <div className="vchat-chips">
          {attachments.map((file) => (
            <div
              key={file.localId}
              className={`vchat-chip ${
                file.status === "failed" ? "vchat-chip--failed" : ""
              }`}
              title={file.errorMessage || file.originalName}
            >
              <FileText size={14} className="vchat-chip-icon" aria-hidden="true" />
              <span className="vchat-chip-name">
                {truncateName(file.originalName)}
              </span>
              <span className="vchat-chip-size">{formatBytes(file.size)}</span>
              {file.status === "uploading" || file.status === "processing" ? (
                <span className="vchat-chip-spinner" aria-label="Processing" />
              ) : file.status === "ready" ? (
                <Check
                  size={13}
                  className="vchat-chip-ok"
                  aria-label="Ready"
                />
              ) : (
                <span className="vchat-chip-err-mark" aria-label="Failed">
                  ×
                </span>
              )}
              {file.status === "failed" && file.errorMessage && (
                <span className="vchat-chip-err-text">{file.errorMessage}</span>
              )}
              <button
                type="button"
                className="vchat-chip-remove"
                onClick={() => onRemoveFile?.(file.localId)}
                aria-label={`Remove ${file.originalName}`}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {validationError && (
        <p className="vchat-upload-error" role="alert">
          {validationError}
        </p>
      )}

      <div className="vchat-composer-row">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_MIME_TYPES.join(",")}
          className="vchat-sr"
          onChange={(e) => {
            if (e.target.files?.length) {
              onAddFiles?.(e.target.files);
            }
            e.target.value = "";
          }}
        />

        <button
          type="button"
          className="vchat-icon-btn"
          disabled={!canAttach || isRunning}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach files"
          title={
            canAttach
              ? "Attach PDF or image"
              : "Send a message first to attach files"
          }
        >
          <Paperclip size={18} aria-hidden="true" />
        </button>

        <textarea
          ref={textareaRef}
          className="vchat-textarea"
          rows={1}
          placeholder="Ask anything"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Message input"
        />

        {!isConnected && (
          <span className="vchat-reconnecting" role="status">
            Reconnecting...
          </span>
        )}

        {isRunning ? (
          <button
            type="button"
            className="vchat-send-btn vchat-stop-btn"
            onClick={() => onCancel?.()}
            disabled={isCancelling}
            aria-label="Stop generating"
          >
            <Square size={14} fill="currentColor" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            className="vchat-send-btn"
            disabled={!canSend}
            aria-label="Send message"
          >
            <ArrowUp size={18} strokeWidth={2.25} aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}
