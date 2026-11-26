import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const instance = axios.create({
  baseURL: `${API_BASE}/api/auth`,
  withCredentials: true,
});

export const registerUser = async ({ email, username, password }) => {
  const response = await instance.post("/register", {
    email,
    username,
    password,
  });
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await instance.post("/login", {
    email,
    password,
  });
  return response.data;
};

export const getMe = async () => {
  const response = await instance.get("/get-me");
  return response.data;
};

export const logout = async () => {
  const response = await instance.get("/logout");
  return response.data;
};

export const redirectToGoogleAuth = () => {
  window.location.assign(`${API_BASE}/api/auth/google`);
};
