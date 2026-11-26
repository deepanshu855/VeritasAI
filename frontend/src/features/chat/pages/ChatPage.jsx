import { useState } from "react";
import { useParams } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import { useFileUpload } from "../hooks/useFileUpload";
import Composer from "../component/Composer";
import MessageList from "../component/MessageList";

export default function ChatPage() {
  const { chatId } = useParams();
  const [draft, setDraft] = useState("");

  const {
    messages,
    streaming,
    stageLabel,
    isRunning,
    error,
    socketStatus,
    sendMessage,
    cancelRun,
  } = useChat(chatId || null);

  const {
    attachments,
    validationError,
    hasPendingOrFailed,
    addFiles,
    removeFile,
  } = useFileUpload(chatId || null);

  const isEmpty = messages.length === 0 && !isRunning && !error;
  const isConnected = socketStatus === "connected";

  const handleSubmit = () => {
    const sent = sendMessage(draft);
    if (sent) {
      setDraft("");
    }
  };

  const composerNode = (
    <Composer
      value={draft}
      onChange={setDraft}
      onSubmit={handleSubmit}
      onCancel={cancelRun}
      isRunning={isRunning}
      isCancelling={streaming.status === "cancelling"}
      isConnected={isConnected}
      canAttach={Boolean(chatId)}
      attachments={attachments}
      validationError={validationError}
      hasPendingOrFailed={hasPendingOrFailed}
      onAddFiles={addFiles}
      onRemoveFile={removeFile}
    />
  );

  if (isEmpty) {
    return (
      <section className="vchat-empty-wrap">
        <div className="vchat-empty-inner">
          <h1 className="vchat-empty-title">What do you want to know?</h1>
          <p className="vchat-empty-sub">
            Search the web or ask your documents. Answers come with sources.
          </p>
          {composerNode}
        </div>
      </section>
    );
  }

  return (
    <section className="vchat-thread-wrap">
      <MessageList
        messages={messages}
        streaming={streaming}
        stageLabel={stageLabel}
        isRunning={isRunning}
        error={error}
      />
      <div className="vchat-dock">{composerNode}</div>
    </section>
  );
}
