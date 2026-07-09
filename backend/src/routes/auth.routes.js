import { Router } from "express";
import { registerController } from "../controllers/auth.controller.js";
import { registerValidator } from "../validator/auth.validation.js";

const authRouter = Router();

authRouter.post("/register", registerValidator, registerController);

export default authRouter;
