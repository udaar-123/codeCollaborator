import express from "express"
import {
  createRoom,
  getMyRoom,
  getRoom,
  joinRoom,
  updateLanguage,
  deleteRoom,
} from "../controllers/room.controller.js"
import { verifyToken } from "../middlewares/verifyToken.js"

const router = express.Router()

router.use(verifyToken)

router.post("/create", createRoom)
router.get("/my", getMyRoom)
router.get("/:roomId", getRoom)
router.post("/join", joinRoom)
router.patch("/:roomId/language", updateLanguage)
router.delete("/:roomId", deleteRoom)

export default router