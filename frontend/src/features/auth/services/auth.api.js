import axios from "axios";

const instance = axios.create({
  baseURL: "//localhost:3000/api/auth",
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

export const forgotPassword = async (email) => {
  const response = await instance.post("/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (newPassword, token) => {
  const response = await instance.post(`/reset-password?token=${token}`, {
    newPassword,
  });
  return response.data
};
