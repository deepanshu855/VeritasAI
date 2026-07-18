import { useDispatch } from "react-redux";
import {
  loginUser,
  registerUser,
  getMe,
  resetPassword,
  logout,
} from "../services/auth.api";
import { setUser, setLoading, setError } from "../auth.slice";

export const useAuth = () => {
  const dispatch = useDispatch();

  const handleRegister = async ({ email, username, password }) => {
    try {
      dispatch(setLoading(true));
      const data = await registerUser({ email, username, password });
    } catch (error) {
      dispatch(
        setError(error.response?.data?.message || "Registration failed"),
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLogin = async ({ email, password }) => {
    try {
      dispatch(setLoading(true));
      const data = await loginUser({ email, password });
      dispatch(setUser(data.user));
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        "Login failed";

      dispatch(setError(errorMessage));
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

  const handleResetPassword = async (password, token) => {
    try {
      dispatch(setLoading(true));
      console.log(token);
      const data = await resetPassword(password, token);
    } catch (error) {
      setError(error.response);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLogout = async () => {
    try {
      dispatch(setLoading(true));
      const data = await logout();
      dispatch(setUser(null));
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Logout failed";

      dispatch(setError(errorMessage));
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
  };
};
