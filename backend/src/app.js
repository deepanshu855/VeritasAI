import "dotenv/config";
import express from "express";

const app = express();

// Import routes & middleware
import authRouter from "./routes/auth.routes.js";
import handleError from "./middlewares/error.middleware.js";

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);

app.use(handleError);

export default app;
