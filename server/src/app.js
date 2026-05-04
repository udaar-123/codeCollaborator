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

const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ""));
}

// Add Vercel URL if set
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (
      allowedOrigins.includes(normalizedOrigin) ||
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoute);
app.use("/api/rooms", roomRouter);
app.use("/api/sessions", sessionRoute);
app.use(errorHandle);
connectDB();

const port = process.env.PORT || 3000;
server.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
