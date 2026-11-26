import { createBrowserRouter } from "react-router-dom";
import Register from "../features/auth/pages/Register";
import Login from "../features/auth/pages/Login";
import ChatLayout from "../features/chat/pages/ChatLayout";
import ChatPage from "../features/chat/pages/ChatPage";
import Protected from "../features/auth/component/Protected";
import Landing from "../features/landing/pages/Landing";
import PageNotFound from "../features/shared/components/PageNotFound";
import PublicLayout from "../features/shared/component/PublicLayout";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: <Landing />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
    ],
  },
  {
    path: "/chat",
    element: (
      <Protected>
        <ChatLayout />
      </Protected>
    ),
    children: [
      {
        index: true,
        element: <ChatPage />,
      },
      {
        path: ":chatId",
        element: <ChatPage />,
      },
    ],
  },
  {
    path: "*",
    element: <PageNotFound />,
  },
]);
