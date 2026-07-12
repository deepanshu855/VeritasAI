import { Router } from "express";
import {
  forgotPasswordController,
  getMeController,
  loginController,
  registerController,
  resendVerifyEmailController,
  verifyEmailController,
} from "../controllers/auth.controller.js";
import {
  registerValidator,
  loginValidator,
} from "../validator/auth.validation.js";
import { identifyUser } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", registerValidator, registerController);
authRouter.get("/verify-email", verifyEmailController);
authRouter.post("/login", loginValidator, loginController);
authRouter.get("/get-me", identifyUser, getMeController);
authRouter.post("/resend-email", resendVerifyEmailController);
authRouter.post("/forgot-password", forgotPasswordController); // This sends the password reset email.

// Need to add reset password route

export default authRouter;
