import Room from "../models/room.schema.js";
import Session from "../models/session.schema.js";
import { asyncHandler } from "../middlewares/errorHandle.js";
import { DEFAULT_CODE } from "../utils/languageConfig.js";

const CURSOR_COLORS = [
  "#58a6ff",
  "#3fb950",
  "#f78166",
  "#d2a8ff",
  "#ffa657",
  "#79c0ff",
];

const formatRoom = (room) => ({
  _id: room._id,
  roomId: room.roomId,
  name: room.name,
  language: room.language,
  isPublic: room.isPublic,
  content: room.content,
  version: room.version,
  owner: room.owner,
  participants: room.participants,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});

export const createRoom = asyncHandler(async (req, res) => {
  const { name, language, isPublic } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Room name is required" });
  }
  const selectedLang = language || "javascript";
  const room = await Room.create({
    name,
    language: selectedLang,
    isPublic: isPublic !== undefined ? isPublic : true,
    owner: req.user._id,
    content: DEFAULT_CODE[selectedLang] || "",
    version: 0,
    participants: [
      {
        userId: req.user._id,
        role: "owner",
        color: CURSOR_COLORS[0],
      },
    ],
  });
  return res.status(201).json({ room: formatRoom(room) });
});

export const getMyRoom = asyncHandler(async (req, res) => {
  const rooms = await Room.find({
    "participants.userId": req.user._id,
  })
    .populate("owner", "name email avatar")
    .sort({ updatedAt: -1 });
  return res.status(200).json({ rooms: rooms.map(formatRoom) });
});

export const getRoom = asyncHandler(async (req, res) => {
  const roomId = req.params.roomId;
  const room = await Room.findOne({
    roomId,
  }).populate("owner", "name email avatar");
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  if (!room.isPublic) {
    const isMember = room.participants.some(
      (p) => p.userId.toString() === req.user._id.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a participant of this room" });
    }
  }
  console.log("code on send frontend", room.content);
  return res.status(200).json({ room: formatRoom(room) });
});

export const joinRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.body;
  const room = await Room.findOne({
    roomId,
  });
  if (!room) {
    return res.status(403).json({ message: "room for find by given room id" });
  }
  const color = CURSOR_COLORS[room.participants.length % CURSOR_COLORS.length];
  const alreadyIn = room.participants.some(
    (p) => p.userId.toString() === req.user._id,
  );
  if (!alreadyIn) {
    room.participants.push({
      userId: req.user._id,
      role: "editor",
      color,
    });
    await room.save();
  }

  const updatedRoom = await Room.findOne({ roomId })
    .populate("owner", "name , email , avatar")
    .populate("participants.userId", "name email avatar");
  return res.status(201).json({ room: formatRoom(updatedRoom) });
});

export const updateLanguage = asyncHandler(async (req, res) => {
  const { roomId, language } = req.params;
  if (!roomId || !language)
    return res.status(401).json({
      message: `both roomId:${roomId} and language: ${language} needed`,
    });
  const room = await Room.findOne({ roomId });
  if (!room)
    return res
      .status(401)
      .json({ message: "Invalid roomId given to change the language" });
  const isMember = room.participants.some(
    (p) => p.userId.toString() === req.user._id.toString(),
  );
  if (!isMember || isMember.role == "viewer") {
    return res.status(401).json({
      message: `you not a member of this room ${room.name} to change the language`,
    });
  }
  room.language = language;
  await room.save();
  return res.status(200).json({
    message: `langusge change succsessfully for room ${room.name} by ${isMember.userId}`,
  });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const roomId = req.params.roomId;
  if (!roomId) {
    return res
      .status(401)
      .json({ message: "roomId require  for delete a room" });
  }
  const room = await Room.findOne({ roomId });
  if (!room) {
    return res
      .status(403)
      .json({ message: "No room found for given room id for deletion" });
  }
  if (room.owner.toString() !== req.user._id.toString()) {
    return res
      .status(401)
      .json({ message: "Only owner have rights to delete the room" });
  }
  await Room.deleteOne({ roomId });
  await Session.deleteMany({ roomId });
  return res.status(201).json({
    message: `Room deleted for roomID: ${roomId} and name :${room.name}`,
  });
});
