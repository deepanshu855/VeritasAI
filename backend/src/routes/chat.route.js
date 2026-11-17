import { Router } from "express";
import { identifyUser } from "../middlewares/auth.middleware.js";
import {
  deleteChat,
  getMessage,
  getUserChats,
  sendMessage,
} from "../controllers/chat.controller.js";
import { uploadSingleFile } from "../middlewares/upload.middleware.js";
import { uploadFile, getFile } from "../controllers/file.controller.js";

const chatRouter = Router();

chatRouter.post("/", identifyUser, sendMessage);
chatRouter.get("/", identifyUser, getUserChats);
chatRouter.get("/:chatId/messages", identifyUser, getMessage);
chatRouter.delete("/delete/:chatId", identifyUser, deleteChat);
chatRouter.post("/:chatId/files", identifyUser, ...uploadSingleFile, uploadFile);
chatRouter.get("/:chatId/files/:fileId", identifyUser, getFile);

export default chatRouter;
