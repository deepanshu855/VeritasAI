import { createBrowserRouter } from "react-router-dom";
import Register from "../features/auth/pages/Register";
import Login from "../features/auth/pages/Login";
import Dashboard from "../features/chat/pages/Dashboard";
import Protected from "../features/auth/component/Protected";
import Landing from "../features/shared/pages/Landing";
import ResetPassword from "../features/auth/component/ResetPassword";
import PageNotFound from "../features/shared/components/PageNotFound";
import VerifyEmail from "../features/auth/component/VerifyEmail";

export const router = createBrowserRouter([
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
    path: "/dashboard",
    element: (
      <Protected>
        <Dashboard />
      </Protected>
    ),
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "verify-email",
    element: <VerifyEmail />
  },
  {
    path: "*",
    element: <PageNotFound />,
  },
]);
