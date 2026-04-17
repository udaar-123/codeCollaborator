import express from "express";
import {
  saveSession,
  getRoomSessions,
  getSession,
} from "../controllers/session.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.use(verifyToken);

router.post("/save", saveSession);
router.get("/room/:roomId", getRoomSessions);
router.get("/:sessionId", getSession);

export default router;
