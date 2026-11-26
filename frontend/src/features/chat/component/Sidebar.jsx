import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, LogOut, PanelLeftClose, Plus, Trash2, X } from "lucide-react";
import BrandLogo from "../../shared/component/BrandLogo";

export default function Sidebar({
  isOpen,
  conversations = [],
  activeChatId,
  onCollapse,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onLogout,
  userName,
}) {
  const [confirmId, setConfirmId] = useState(null);

  return (
    <aside
      className={`vchat-sidebar ${isOpen ? "vchat-sidebar--open" : ""}`}
      aria-label="Chat sidebar"
    >
      <div className="vchat-sidebar-top">
        <div className="vchat-sidebar-head">
          <Link to="/" className="vchat-brand-link" aria-label="VeritasAI home">
            <BrandLogo size={32} />
          </Link>
          <button
            type="button"
            className="vchat-icon-btn"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={18} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className="vpub-button vpub-button--sm vchat-new-btn"
          onClick={onNewChat}
        >
          <Plus size={16} aria-hidden="true" />
          <span>New chat</span>
        </button>
      </div>

      <nav className="vchat-sidebar-list" aria-label="Conversations">
        {conversations.map((chat) => {
          const isActive = chat.id === activeChatId;
          const isConfirming = confirmId === chat.id;

          if (isConfirming) {
            return (
              <div key={chat.id} className="vchat-chat-row vchat-chat-row--confirm">
                <span className="vchat-confirm-text">Delete?</span>
                <div className="vchat-confirm-actions">
                  <button
                    type="button"
                    className="vchat-row-btn vchat-row-btn--danger"
                    onClick={() => {
                      setConfirmId(null);
                      onDeleteChat?.(chat.id);
                    }}
                    aria-label="Confirm delete"
                  >
                    <Check size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="vchat-row-btn"
                    onClick={() => setConfirmId(null)}
                    aria-label="Cancel delete"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={chat.id}
              className={`vchat-chat-row ${isActive ? "vchat-chat-row--active" : ""}`}
            >
              <button
                type="button"
                className="vchat-chat-select"
                onClick={() => onSelectChat?.(chat.id)}
                title={chat.title}
              >
                <span className="vchat-chat-title">{chat.title}</span>
              </button>
              <button
                type="button"
                className="vchat-row-btn vchat-row-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmId(chat.id);
                }}
                aria-label={`Delete ${chat.title}`}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </nav>

      <div className="vchat-sidebar-footer">
        <span className="vchat-user-name">{userName || ""}</span>
        <button
          type="button"
          className="vchat-icon-btn"
          onClick={onLogout}
          aria-label="Log out"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
