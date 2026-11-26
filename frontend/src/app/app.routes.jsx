import { createBrowserRouter } from "react-router-dom";
import Register from "../features/auth/pages/Register";
import Login from "../features/auth/pages/Login";
import Dashboard from "../features/chat/pages/Dashboard";
import Protected from "../features/auth/component/Protected";
import Landing from "../features/landing/pages/Landing";
import ResetPassword from "../features/auth/component/ResetPassword";
import PageNotFound from "../features/shared/components/PageNotFound";
import VerifyEmail from "../features/auth/component/VerifyEmail";
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
      {
        path: "/reset-password",
        element: <ResetPassword />,
      },
      {
        path: "/verify-email",
        element: <VerifyEmail />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <Protected>
        <Dashboard />
      </Protected>
    ),
  },
  {
    path: "*",
    element: <PageNotFound />,
  },
]);
