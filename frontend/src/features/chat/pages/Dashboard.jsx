import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useChat } from "../hooks/useChat";

const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const { initializeSocketConnection } = useChat();

  useEffect(() => {
    initializeSocketConnection();
  }, []);

  return <div>Hello {user.username}</div>;
};

export default Dashboard;
