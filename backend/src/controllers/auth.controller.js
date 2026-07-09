import "dotenv/config"
import userModel from "../models/user.model.js";
import { sendEmail } from "../services/mail.services.js";
import jwt from "jsonwebtoken";

export const registerController = async (req, res, next) => {
  const { username, email, password } = req.body;

  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ email }, { username }],
  });

  if (isUserAlreadyExists) {
    const error = new Error("Useralready exists with email or username");
    error.status = 409;
    return next(error);
  }

  const user = await userModel.create({
    username,
    email,
    password,
  });

  const emailToken = jwt.sign(
    {
      email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "3d" },
  );

  await sendEmail({
    to: email,
    subject: "Welcome to Veritas AI",
    html: `
    <h2>Welcome to Veritas AI! 🎉</h2>
    <p>You're all set to start exploring AI-powered conversations, web research, and more.</p>
    <p>Please, verify yourself...</p>
    <a href=http://localhost:3000/api/auth/verify-email?token=${emailToken}>Verify Email</a>
    <br>
    <p><strong>— The Veritas AI Team</strong></p>
  `,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: user._id,
      username,
      email,
    },
  });
};

export const verifyEmailController = async (req, res, next) => {
  const { token } = req.query;

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    error.status = 403;
    next(error);
  }

  const { email } = decoded;

  const user = await userModel.findOne({ email });

  if (!email) {
    const error = new Error("User doesn't exist");
    error.status = 404;
    return next(error);
  }

  user.verified = true;
  user.save();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Email Verified</title>
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1>✅ Email Verified Successfully!</h1>
        <p>Your email has been verified.</p>
        <p>You can now return to <strong>Veritas AI</strong> and log in.</p>
      </body>
    </html>
  `;

  res.send(html);
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

  if (!user.verified) {
    const error = new Error("Please verify your email before logging in");
    error.status = 400;
    return next(error);
  }

  const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  res.cookie("token", token);

  res.status(200).json({
    success: true,
    message: "Login successfully",
    user: {
      id: user._id,
      email,
      username: user.username,
    },
  });
};

export const getMeController = async (req, res, next) => {
  const { email } = req.user;

  const user = await userModel.findOne({ email }).select("-password");

  if (!user) {
    const error = new Error("User doesn't exist");
    error.status = 404;
    return next(error);
  }

  res.status(200).json({
    success: true,
    message: "User fetched successfully.",
    user
  });
};
