import { asyncHandler } from "../middlewares/errorHandle.js";
import Session from "../models/session.schema.js";

export const saveSession = asyncHandler(async (req, res) => {
  const {
    roomId,
    roomName,
    events,
    finalCode,
    language,
    duration,
    participants,
    startedAt,
    endedAt,
  } = req.body;

  if (!roomId || !events || events.length === 0) {
    return res.status(400).json({ message: "roomId and events are required" });
  }

  console.log("final code", finalCode);

  let session;
  try {
    session = await Session.create({
      roomId,
      roomName,
      recordedBy: req.user._id,
      participants,
      events,
      finalCode,
      language,
      duration,
      startedAt,
      endedAt,
    });
  } catch (error) {
    console.log("error saving session", error);
  }

  return res.status(201).json({
    session: {
      _id: session._id,
      roomId: session.roomId,
      duration: session.duration,
      createdAt: session.createdAt,
    },
  });
});

export const getRoomSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ roomId: req.params.roomId })
    .select("-events")
    .populate("recordedBy", "name")
    .sort({ createdAt: -1 })
    .limit(20);

  return res.status(200).json({ sessions });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.sessionId);

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }
  console.log("code on send to frontend", session.finalCode);
  return res.status(200).json({ session });
});
