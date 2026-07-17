import { createBrowserRouter } from "react-router-dom";
import Register from "../features/auth/pages/Register";
import Login from "../features/auth/pages/Login";
import Dashboard from "../features/chat/pages/Dashboard";
import Protected from "../features/auth/component/Protected";
import ResetPassword from "../features/auth/pages/ResetPassword";
import Landing from "../features/shared/pages/Landing";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />
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
]);
