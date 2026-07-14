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
