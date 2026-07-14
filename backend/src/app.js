import "dotenv/config";
import express from "express";
import cookiePareser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

const app = express();

// Import routes & middleware
import authRouter from "./routes/auth.routes.js";
import handleError from "./middlewares/error.middleware.js";

// Middleware
app.use(express.json());
app.use(cookiePareser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRouter);

app.use(handleError);

export default app;
