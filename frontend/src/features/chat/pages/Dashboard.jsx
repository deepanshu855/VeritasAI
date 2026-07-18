import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useChat } from "../hooks/useChat";
import { setCurrentChatId } from "../chat.slice";
import "../styles/dashboard.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, ThumbsUp, ThumbsDown, Menu, X, MoreHorizontal, Trash2, LogOut } from "lucide-react";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Local UI state for the 3-dot dropdown menu
  const [activeDropdown, setActiveDropdown] = useState(null);

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
    setIsMobileMenuOpen(false);
    setActiveDropdown(null); // Close dropdown when a chat is opened
  };

  const toggleDropdown = (e, chatId) => {
    e.stopPropagation(); // Prevents the chat from opening when clicking the 3 dots
    setActiveDropdown(activeDropdown === chatId ? null : chatId);
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? "show" : ""}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Sidebar */}
      <div className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-header flex-between">
            <h1 className="sidebar-title">VERITAS-AI</h1>
            <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <button
            onClick={() => {
              dispatch(setCurrentChatId(null));
              setIsMobileMenuOpen(false);
            }}
            className="new-chat-btn"
          >
            <span className="plus-icon">+</span> New Chat
          </button>

          <div className="recent-history">
            <h3 className="history-title">RECENT HISTORY</h3>
            <div className="history-list">
              {Object.values(chats).length > 0 ? (
                Object.values(chats).map((chat) => (
                  <div
                    key={chat.id}
                    className={`history-item ${currentChatId === chat.id ? "active" : ""}`}
                    onClick={() => openChat(chat.id)}
                  >
                    <div className="history-content">
                      <p className="history-title-text" title={chat.title}>{chat.title}</p>
                      {chat.lastUpdated && (
                        <p className="history-time">
                          {new Date(chat.lastUpdated).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    {/* 3-Dot Menu Area */}
                    <div className="history-menu-container">
                      <button 
                        className="more-options-btn"
                        onClick={(e) => toggleDropdown(e, chat.id)}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {activeDropdown === chat.id && (
                        <div 
                          className="dropdown-menu" 
                          onMouseLeave={() => setActiveDropdown(null)}
                        >
                          <button 
                            className="dropdown-item delete-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              // UI behavior only: Close dropdown after clicking delete
                              console.log("Delete button clicked for chat:", chat.id);
                              setActiveDropdown(null);
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-history">No chats yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-info">
              <p className="user-name">{user?.username || "John Doe"}</p>
              <p className="user-status">Verified User</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <span className="model-badge">● MODEL: VERITAS-V1</span>
          </div>
          
          <button 
            className="logout-btn" 
            onClick={() => console.log("Add your logout dispatch logic here")}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="messages-area">
          <div className="messages-wrapper">
            {!currentChatId ||
            !chats[currentChatId] ||
            chats[currentChatId]?.messages.length === 0 ? (
              <div className="empty-chat">
                <h2 className="empty-title">How can I help you today?</h2>
                <p className="empty-desc">
                  Search the internet or ask a complex question to get started.
                </p>
              </div>
            ) : (
              <>
                {chats[currentChatId]?.messages.map((msg, idx) => (
                  <div key={idx} className={`message-row ${msg.role === "user" ? "user" : "ai"}`}>
                    {msg.role === "user" ? (
                      <>
                        <div className="message-bubble user-bubble">
                          {msg.content}
                        </div>
                        <div className="message-meta">
                          <span className="timestamp">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="message-bubble ai-bubble">
                          <div className="markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <div className="message-meta">
                          <span className="timestamp">
                             {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className="ai-actions">
                            <button className="action-btn">
                              <ThumbsUp size={14} />
                            </button>
                            <button className="action-btn">
                              <ThumbsDown size={14} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="message-row ai">
                    <div className="message-bubble ai-bubble">
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
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
              <Send size={18} />
            </button>
          </div>
          <p className="footer-text">
            VERITAS-AI SEARCHES THE WEB TO ASSIST YOU, BUT ALWAYS VERIFY IMPORTANT FACTS
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;