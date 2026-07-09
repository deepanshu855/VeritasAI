import userModel from "../models/user.model.js";
import { sendEmail } from "../services/mail.services.js";

export const registerController = async (req, res, next) => {
  const { username, email, password } = req.body;

  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ email }, { username }],
  });

  if (isUserAlreadyExists) {
    const error = new Error("Useralready exists with email or username");
    error.status = 409;
    return next(error)
  }

  const user = await userModel.create({
    username,
    email,
    password,
  });

  await sendEmail({
    to: email,
    subject: "Welcome to Veritas AI",
    html: `
    <h2>Welcome to Veritas AI! 🎉</h2>
    <p>You're all set to start exploring AI-powered conversations, web research, and more.</p>
    <br>
    <p><strong>— The Veritas AI Team</strong></p>
  `,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id:user._id,
      username,
      email,
    },
  });
};
