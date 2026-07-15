import { Router } from "express";
import { identifyUser } from "../middlewares/auth.middleware.js";
import {
  deleteChat,
  getMessage,
  getUserChats,
  sendMessage,
} from "../controllers/chat.controller.js";

const chatRouter = Router();

chatRouter.post("/", identifyUser, sendMessage);
chatRouter.get("/", identifyUser, getUserChats);
chatRouter.get("/:chatId/messages", identifyUser, getMessage);
chatRouter.delete("/delete/:chatId", identifyUser, deleteChat);

export default chatRouter;
