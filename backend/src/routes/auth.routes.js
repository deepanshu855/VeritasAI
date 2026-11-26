import { Router } from "express";
import {
  getMeController,
  loginController,
  logoutController,
  registerController,
} from "../controllers/auth.controller.js";
import {
  registerValidator,
  loginValidator,
} from "../validator/auth.validation.js";
import { identifyUser } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", registerValidator, registerController);
authRouter.post("/login", loginValidator, loginController);
authRouter.get("/get-me", identifyUser, getMeController);
authRouter.get("/logout", identifyUser, logoutController);

export default authRouter;
