import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import http from "http";
import authRoute from "./routes/authRoute.js";
import roomRouter from "./routes/room.route.js";
import sessionRoute from "./routes/session.route.js";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import logger from "./utils/logger.js";
import { errorHandle } from "./middlewares/errorHandle.js";
import { initServer } from "./socket/index.js";

const app = express();
const server = http.createServer(app);
export const io = initServer(server);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoute);
app.use("/api/rooms", roomRouter);
app.use("/api/sessions", sessionRoute);
app.use(errorHandle);
connectDB();

const port = 3000;
server.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
