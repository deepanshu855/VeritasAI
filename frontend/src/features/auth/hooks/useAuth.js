import { useDispatch } from "react-redux";
import {
  loginUser,
  registerUser,
  getMe,
  resetPassword,
  logout,
  forgotPassword,
  verifyEmail,
  resendVerifyEmail,
} from "../services/auth.api";
import { setUser, setLoading, setError } from "../auth.slice";
import { toast } from "react-toastify";

export const useAuth = () => {
  const dispatch = useDispatch();

  const handleRegister = async ({ email, username, password }) => {
    try {
      dispatch(setLoading(true));
      const data = await registerUser({ email, username, password });
      toast.success("Verification email sent successfully", {
        autoClose: 1000,
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        "Registration failed";
      toast.error(errorMessage, {
        autoClose: 1000,
      });
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
        autoClose: 1000,
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
    } catch (error) {
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleForgotPassword = async (email) => {
    try {
      dispatch(setLoading(true));
      console.log("Hook: ", email);
      const data = await forgotPassword(email);
      toast.success("Forgot password mail sent successfully");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Cannot send mail";
      toast.error(errorMessage, {
        autoClose: 1000,
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleResetPassword = async (password, token) => {
    try {
      dispatch(setLoading(true));
      const data = await resetPassword(password, token);
      toast.success("Password updated successfully", {
        autoClose: 1000,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Password Update failed", {
        autoClose: 1000,
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLogout = async () => {
    try {
      dispatch(setLoading(true));
      const data = await logout();
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

  const handleVerifyEmail = async (token) => {
    try {
      dispatch(setLoading(true));
      const data = await verifyEmail(token);
      toast.success("Email verified", {
        autoClose:1000
      })
      return data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Verification failed",
      };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleResendVerifyEmail = async (email) => {
    try {
      dispatch(setLoading(true));
      const data = await resendVerifyEmail(email);
      return data;
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Unable to send verification email",
      };
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    handleLogin,
    handleRegister,
    handleGetMe,
    handleResetPassword,
    handleLogout,
    handleForgotPassword,
    handleVerifyEmail,
    handleResendVerifyEmail,
  };
};
