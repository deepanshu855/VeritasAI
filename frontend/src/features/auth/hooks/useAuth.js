import { useDispatch } from "react-redux";
import {
  loginUser,
  registerUser,
  getMe,
  logout,
  redirectToGoogleAuth,
} from "../services/auth.api";
import { setUser, setLoading, setError } from "../auth.slice";
import { toast } from "react-toastify";

export const useAuth = () => {
  const dispatch = useDispatch();

  const handleRegister = async ({ email, username, password }) => {
    try {
      dispatch(setLoading(true));
      const data = await registerUser({ email, username, password });
      toast.success("Registration successful. Please log in.", {
        autoClose: 3000,
      });
      return data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        "Registration failed";
      toast.error(errorMessage, {
        autoClose: 5000,
      });
      return null;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLogin = async ({ email, password }) => {
    try {
      dispatch(setLoading(true));
      const data = await loginUser({ email, password });
      dispatch(setUser(data.user));
      toast.success("Login successfully", {
        autoClose: 1000,
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        "Login failed";

      toast.error(errorMessage, {
        autoClose: 3000,
      });

      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGetMe = async () => {
    try {
      dispatch(setLoading(true));
      const data = await getMe();
      dispatch(setUser(data.user));
    } catch {
      // User is not authenticated
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLogout = async () => {
    try {
      dispatch(setLoading(true));
      await logout();
      dispatch(setUser(null));
      toast.success("Logout successfully", {
        autoClose: 1000,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Logout failed";

      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGoogleLogin = () => {
    redirectToGoogleAuth();
  };

  return {
    handleLogin,
    handleRegister,
    handleGetMe,
    handleLogout,
    handleGoogleLogin,
  };
};
