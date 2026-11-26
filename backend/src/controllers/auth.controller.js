import "dotenv/config";
import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

const issueAuthTokenCookie = (res, user) => {
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
  res.cookie("token", token);
  return token;
};

export const registerController = async (req, res, next) => {
  const { username, email, password } = req.body;

  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ email }, { username }],
  });

  if (isUserAlreadyExists) {
    const error = new Error("User already exists with email or username");
    error.status = 409;
    return next(error);
  }

  const user = await userModel.create({
    username,
    email,
    password,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully.",
    user: {
      id: user._id,
      username,
      email,
      avatar: user.avatar || null,
    },
  });
};

export const loginController = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    const error = new Error("Invalid credentials");
    error.status = 403;
    return next(error);
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    const error = new Error("Invalid credentials");
    error.status = 403;
    return next(error);
  }

  issueAuthTokenCookie(res, user);

  res.status(200).json({
    success: true,
    message: "Login successfully",
    user: {
      id: user._id,
      email,
      username: user.username,
      avatar: user.avatar || null,
    },
  });
};

export const getMeController = async (req, res, next) => {
  const { email } = req.user;

  const user = await userModel
    .findOne({ email })
    .select("-password -googleId");

  if (!user) {
    const error = new Error("User doesn't exist");
    error.status = 404;
    return next(error);
  }

  res.status(200).json({
    success: true,
    message: "User fetched successfully.",
    user,
  });
};

export const logoutController = async (req, res, next) => {
  res.clearCookie("token");

  res.status(200).json({
    success: true,
    message: "Logout successfully",
  });
};

export const googleCallbackController = async (req, res) => {
  const frontendUrl = getFrontendUrl();
  if (!req.user) {
    return res.redirect(`${frontendUrl}/login?error=google_failed`);
  }

  issueAuthTokenCookie(res, req.user);
  return res.redirect(`${frontendUrl}/chat`);
};
