import { Router } from "express";
import {
    getMeController,
    loginController,
  registerController,
  verifyEmailController,
} from "../controllers/auth.controller.js";
import { registerValidator, loginValidator } from "../validator/auth.validation.js";
import { identifyUser } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", registerValidator, registerController);
authRouter.get("/verify-email", verifyEmailController);
authRouter.post("/login", loginValidator, loginController)
authRouter.get("/get-me", identifyUser, getMeController)

export default authRouter;
