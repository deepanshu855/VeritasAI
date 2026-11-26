import { ArrowDown } from "lucide-react";
import { useAutoScroll } from "../hooks/useAutoScroll";
import MessageItem from "./MessageItem";
import MarkdownContent from "./MarkdownContent";

export default function MessageList({
  messages,
  streaming,
  stageLabel,
  isRunning,
  error,
}) {
  const { containerRef, showScrollButton, handleScroll, scrollToBottom } =
    useAutoScroll([messages.length, streaming.text, isRunning, error]);

  return (
    <div className="vchat-messages-shell">
      <div
        ref={containerRef}
        className="vchat-messages-scroll"
        onScroll={handleScroll}
      >
        <div className="vchat-messages-col">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}

          {isRunning && (
            <div className="vchat-turn vchat-turn--ai">
              <div className="vchat-ai-body">
                {stageLabel && (
                  <div className="vchat-stage" aria-live="polite">
                    <span className="vchat-stage-dot" aria-hidden="true" />
                    <span>{stageLabel}</span>
                  </div>
                )}
                {streaming.text && (
                  <MarkdownContent content={streaming.text} isStreaming />
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="vchat-error-line" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      {showScrollButton && (
        <button
          type="button"
          className="vchat-scroll-latest"
          onClick={() => scrollToBottom("smooth")}
          aria-label="Scroll to latest"
        >
          <ArrowDown size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

