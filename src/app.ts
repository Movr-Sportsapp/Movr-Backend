import express from "express";
import connectDb from "./db/index.ts";
import cors from "cors";
import mongoose from "mongoose";
import authRouter from "./routes/auth.routes.ts";
import { notFoundHandler } from "./middleware/notFoundHandler.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { CLIENT_BASE_URL } from "./config.ts";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.ts";
import sportsRouter from "./routes/sport.routes.ts";

const app = express();
connectDb();
app.use(express.json());

app.use(
  cors({
    origin: CLIENT_BASE_URL,
    credentials: true,
    exposedHeaders: ["WWW-Authenticate"],
  }),
);

app.use(cookieParser());
// Health check route
app.get("/api/health", async (req, res) => {
  const mongoStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.status(200).json({
    status: "ok",
    database: mongoStatus,
  });
});

const PORT = process.env.PORT || 5000;
// routes
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/sport", sportsRouter);

// error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
