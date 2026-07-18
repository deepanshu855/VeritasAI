import "dotenv/config";
import userModel from "../models/user.model.js";
import { sendEmail, verifyConnection } from "../services/mail.services.js";
import jwt from "jsonwebtoken";
import { redis } from "../config/cache.js";

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

  const emailToken = jwt.sign(
    {
      id: user._id,
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
    <a href=https://veritasai-v214.onrender.com//api/auth/verify-email?token=${emailToken}>Verify Email</a>
    <br>
    <p><strong>— The Veritas AI Team</strong></p>
  `,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully, Please verify the given mail.",
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
    error.message = "Invalid Token";
    error.status = 403;
    return next(error);
  }
  const { email } = decoded;

  const user = await userModel.findOne({ email });

  if (!user) {
    const error = new Error("User doesn't exist");
    error.status = 404;
    return next(error);
  }

  if (user.verified) {
    const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Already Verified</title>
    </head>
    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1>✅ Email Already Verified</h1>
      <p>Your email address has already been verified.</p>
      <p>You can continue using <strong>Veritas AI</strong> and log in to your account.</p>
    </body>
  </html>
`;

    return res.send(html);
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

export const resendVerifyEmailController = async (req, res, next) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    const error = new Error("User doesn't exist. Please register");
    error.status = 401;
    return next(error);
  }

  const emailToken = jwt.sign(
    {
      email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "3d",
    },
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

  res.status(200).json({
    success: true,
    message: "Verification email sent.",
    email,
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
    user,
  });
};

// This sends the password reset email.
export const forgotPasswordController = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      const error = new Error("User doesn't exist");
      error.status = 403;
      return next(error);
    }

    const emailToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Await the email sending process
    await sendEmail({
      to: email,
      subject: "Reset Password Veritas AI",
      html: `
        <h2>Reset Your Password 🔒</h2>
        <p>We received a request to reset your Veritas AI account password.</p>
        <p>Click the link below to set a new password.</p>
        <a href="https://veritasai-v214.onrender.com/reset-password?token=${emailToken}">Reset Password</a>
        <br>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p><strong>— The Veritas AI Team</strong></p>
      `,
    });

    // Only send the success response if sendEmail succeeds
    res.status(200).json({
      success: true,
      message: "Reset password email sent successfully",
      email,
    });
  } catch (error) {
    // THIS is the crucial part. It will print the exact Nodemailer error to your Render logs.
    console.error("🚨 Error sending email in production:", error);

    const err = new Error(
      "Failed to send reset email. Please try again later.",
    );
    err.status = 500;
    return next(err);
  }
};

export const resetPasswordController = async (req, res, next) => {
  const { token } = req.query;

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    error.status = 403;
    return next(error);
  }

  const { email } = decoded;

  const user = await userModel.findOne({ email });

  if (!user) {
    const error = new Error("User doesn't exist");
    error.status = 401;
    return next(error);
  }

  const { newPassword } = req.body;

  user.password = newPassword;
  user.save();

  res.status(201).json({
    success: true,
    message: "Password updated successfully.",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
};

export const logoutController = async (req, res, next) => {
  const token = req.cookies.token;
  // console.log(req.cookies)
  res.clearCookie("token");

  await redis.set(token, Date.now().toString(), "EX", 60 * 60);

  res.status(200).json({
    success: true,
    message: "Logout successfully",
  });
};
