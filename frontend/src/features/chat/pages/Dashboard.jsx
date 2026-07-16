import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useChat } from "../hooks/useChat";
import { setCurrentChatId } from "../chat.slice";
import "../styles/dashboard.css";
import ReactMarkdown from "react-markdown";

const Dashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const chats = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const isLoading = useSelector((state) => state.chat.isLoading);

  const {
    initializeSocketConnection,
    handleSendMessage,
    handleGetChats,
    handleOpenChats,
  } = useChat();

  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    initializeSocketConnection();
    handleGetChats();
  }, []);

  const handleSubmitMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      console.log("Dashboard ", newMessage, currentChatId);
      await handleSendMessage({
        message: newMessage,
        chatId: currentChatId,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const openChat = (chatId) => {
    dispatch(setCurrentChatId(chatId));
    handleOpenChats(chatId, chats);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">VERITAS-AI</h1>
        </div>

        <button className="new-chat-btn">
          <span className="plus-icon">+</span> New Chat
        </button>

        <div className="recent-history">
          <h3 className="history-title">RECENT HISTORY</h3>
          <div className="history-list">
            {Object.values(chats).length > 0 ? (
              Object.values(chats).map((chat) => (
                <button
                  onClick={() => {
                    openChat(chat.id);
                  }}
                  key={chat.id}
                  type="button"
                  className={`history-item ${currentChatId === chat.id ? "active" : ""}`}
                  title={chat.title}
                >
                  <span className="history-icon">💬</span>
                  <div className="history-content">
                    <p className="history-title-text">{chat.title}</p>
                    {chat.lastUpdated && (
                      <p className="history-time">
                        {new Date(chat.lastUpdated).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <p style={{ fontSize: "12px", color: "#666", padding: "10px" }}>
                No chats yet
              </p>
            )}
          </div>
        </div>

        <div className="user-profile">
          <div className="user-avatar">JD</div>
          <div className="user-info">
            <p className="user-name">{user?.username || "John Doe"}</p>
            <p className="user-status">Verified User</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <span className="model-badge">● MODEL: VERITAS-V1</span>
          <button className="share-btn">⬆</button>
        </div>

        {/* Messages Area */}
        <div className="messages-area">
          {!currentChatId ||
          !chats[currentChatId] ||
          chats[currentChatId]?.messages.length === 0 ? (
            <div className="empty-chat">
              <h2>Start a new conversation</h2>
              <p>Select a chat from the history or create a new one to begin</p>
            </div>
          ) : (
            <>
              {chats[currentChatId]?.messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  {msg.role === "user" ? (
                    <div className="user-message-content">{msg.content}</div>
                  ) : (
                    <div className="ai-message-content">
                      <div className="ai-header">✓ Veritas-AI Response</div>
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="message ai">
                  <div className="ai-message-content">
                    <div className="ai-header">✓ Veritas-AI Response</div>
                    <p className="loading-text">Thinking...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Ask Veritas-AI anything..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmitMessage()}
              disabled={!currentChatId && Object.keys(chats).length === 0}
              className="chat-input"
            />
            <button
              onClick={handleSubmitMessage}
              disabled={isLoading || !newMessage.trim()}
              className="send-btn"
            >
              ✈
            </button>
          </div>
          <p className="footer-text">
            VERITAS-AI MAY PRODUCE INACCURATE INFORMATION ABOUT PEOPLE, PLACES,
            OR FACTS
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
