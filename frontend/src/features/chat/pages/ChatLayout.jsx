import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, PanelLeftOpen } from "lucide-react";
import AeroBackground from "../../shared/component/AeroBackground";
import { useAeroBackgroundProps } from "../../shared/hooks/useAeroBackgroundProps";
import { useChatSocket } from "../hooks/useChatSocket";
import { useChatList } from "../hooks/useChatList";
import Sidebar from "../component/Sidebar";
import "../../shared/styles/public.css";
import "../styles/chat.css";

export default function ChatLayout() {
  const bgProps = useAeroBackgroundProps();
  useChatSocket();
  const {
    conversations,
    activeChatId,
    userName,
    selectChat,
    startNewChat,
    removeChat,
    logout,
  } = useChatList();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("vchat-root");
    return () => {
      document.documentElement.classList.remove("vchat-root");
    };
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen]);

  return (
    <>
      <AeroBackground {...bgProps} />
      <div className="vchat-scrim" aria-hidden="true" />

      <div
        className={`vchat-app ${isCollapsed ? "vchat-app--collapsed" : ""}`}
      >
        {isDrawerOpen && (
          <div
            className="vchat-drawer-backdrop"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar
          isOpen={isDrawerOpen}
          conversations={conversations}
          activeChatId={activeChatId}
          userName={userName}
          onCollapse={() => {
            setIsDrawerOpen(false);
            setIsCollapsed(true);
          }}
          onNewChat={() => {
            setIsDrawerOpen(false);
            startNewChat();
          }}
          onSelectChat={(id) => {
            setIsDrawerOpen(false);
            selectChat(id);
          }}
          onDeleteChat={removeChat}
          onLogout={logout}
        />

        <main className="vchat-main">
          {isCollapsed && (
            <button
              type="button"
              className="vchat-icon-btn vchat-expand-btn"
              onClick={() => setIsCollapsed(false)}
              aria-label="Open sidebar"
            >
              <PanelLeftOpen size={18} aria-hidden="true" />
            </button>
          )}

          <div className="vchat-mobile-bar">
            <button
              type="button"
              className="vchat-icon-btn"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          </div>

          <Outlet />
        </main>
      </div>
    </>
  );
}
