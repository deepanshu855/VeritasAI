import { useCallback, useState } from "react";
import { FileText } from "lucide-react";
import MarkdownContent from "./MarkdownContent";

export default function MessageItem({ message }) {
  const [highlightedSource, setHighlightedSource] = useState(null);

  const handleCitationClick = useCallback((num) => {
    setHighlightedSource(num);
    const el = document.getElementById(`vchat-src-${message.id}-${num}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setTimeout(() => setHighlightedSource(null), 1600);
  }, [message.id]);

  if (message.role === "user") {
    const attachments = message.attachments || [];
    return (
      <div className="vchat-turn vchat-turn--user">
        <div className="vchat-user-bubble">
          {attachments.length > 0 && (
            <div className="vchat-msg-files">
              {attachments.map((file, idx) => (
                <span
                  key={file._id || idx}
                  className="vchat-msg-file-chip"
                  title={file.originalName}
                >
                  <FileText size={13} aria-hidden="true" />
                  <span className="vchat-msg-file-name">
                    {file.originalName}
                  </span>
                </span>
              ))}
            </div>
          )}
          {message.content && (
            <div className="vchat-user-text">{message.content}</div>
          )}
        </div>
      </div>
    );
  }

  const citations = message.citations || [];

  return (
    <div className="vchat-turn vchat-turn--ai">
      <div className="vchat-ai-body">
        <MarkdownContent
          content={message.content}
          citations={citations}
          onCitationClick={handleCitationClick}
        />

        {citations.length > 0 && (
          <div className="vchat-sources" aria-label="Sources">
            {citations.map((c) => (
              <span
                key={c.number}
                id={`vchat-src-${message.id}-${c.number}`}
                className={`vchat-source-chip ${
                  highlightedSource === c.number
                    ? "vchat-source-chip--active"
                    : ""
                }`}
              >
                <span className="vchat-source-num">{c.number}</span>
                <span className="vchat-source-label">
                  {c.fileName}
                  {c.pageNumber ? ` · p.${c.pageNumber}` : ""}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

