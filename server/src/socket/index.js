import { executeCode } from "../services/docker.service.js";
import { Server } from "socket.io";
import logger from "../utils/logger.js";
import { verifySocketToken } from "../middlewares/verifySocketToken.js";
import Room from "../models/room.schema.js";
import { transform, applyOp } from "../services/ot.service.js";
import {
  initRoomState,
  getRoomState,
  updateRoomState,
  getOperationsSince,
} from "../services/room.service.js";

export const onlineUsers = new Map();

export function initServer(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(verifySocketToken);

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    logger.info(`User ${userId} connected with socket ${socket.id}`);

    // ─── JOIN ROOM ───────────────────────────────────────────
    socket.on("join-room", async ({ roomId }) => {
      try {
        const room = await Room.findOne({ roomId }).populate(
          "participants.userId",
          "name email avatar",
        );
        if (!room) return socket.emit("error", "Room not found");

        // Leave previous rooms
        Array.from(socket.rooms)
          .filter((r) => r !== socket.id)
          .forEach((r) => socket.leave(r));

        socket.join(roomId);
        socket.currentRoom = roomId;

        // Init room state from DB if not already in memory
        const existing = getRoomState(roomId);
        if (!existing) {
          initRoomState(roomId, room.content || "", room.version || 0);
        }

        const state = getRoomState(roomId);

        // Send current state to joining user
        socket.emit("room-state", {
          content: state.content,
          version: state.version,
          language: room.language,
          participants: room.participants,
        });

        // Tell others this user joined
        socket.to(roomId).emit("user-joined", {
          userId,
          name: socket.user.name,
        });

        logger.info({ event: "room_joined", userId, roomId });
      } catch (error) {
        socket.emit("error", "Failed to join room");
        logger.error({ event: "join_room_error", error: error.message });
      }
    });

    // ─── OPERATION ─────────────────────
    socket.on("operation", async ({ roomId, op, batchId, version }) => {
      try {
        const state = getRoomState(roomId);
        if (!state) return;

        // Get all ops that happened after client's version
        const concurrentOps = getOperationsSince(roomId, version);

        // Transform incoming op against all concurrent ops
        let transformedOp = op;
        for (const serverOp of concurrentOps) {
          transformedOp = transform(serverOp, transformedOp);
        }

        // Apply transformed op to server document
        const newContent = applyOp(state.content, transformedOp);
        const expectedLengthChange =
          transformedOp.type === "insert"
            ? transformedOp.text.length
            : transformedOp.type === "delete"
              ? -transformedOp.length
              : 0;

        const actualLengthChange = newContent.length - state.content.length;

        if (actualLengthChange !== expectedLengthChange) {
          console.error("❌ OT sanity check failed — not saving", {
            expected: expectedLengthChange,
            actual: actualLengthChange,
            op: transformedOp,
            oldContent: state.content,
            newContent,
          });
          return;
        }
        updateRoomState(roomId, newContent, transformedOp);

        const updatedState = getRoomState(roomId);

        io.to(roomId).emit("operation", {
          op: transformedOp,
          batchId,
          version: updatedState.version,
          userId,
        });

        await Room.updateOne(
          { roomId },
          {
            content: updatedState.content,
            version: updatedState.version,
          },
        );
      } catch (error) {
        logger.error({ event: "operation_error", error: error.message });
      }
    });

    // ─── LEAVE ROOM ──────────────────────────────────────────
    socket.on("leave-room", ({ roomId }) => {
      socket.leave(roomId);
      socket.to(roomId).emit("cursor-remove", { userId });
      socket.to(roomId).emit("user-left", { userId });
    });

    // ─── LANGUAGE CHANGE ─────────────────────────────────────
    socket.on("language-change", ({ roomId, language }) => {
      socket.to(roomId).emit("language-changed", { language });
    });

    // ─── RESET ROOM ───────────────────────────────────────────
    socket.on("reset-room", async ({ roomId, language, content }) => {
      try {
        const state = getRoomState(roomId);
        if (!state) return;

        // Update in-memory state with boilerplate
        state.content = content;
        state.version = 0;
        state.operations = [];

        // Broadcast reset to all users in room (including sender)
        io.to(roomId).emit("room-reset", {
          content,
          version: 0,
          language,
        });

        // Save to DB immediately with language update
        await Room.updateOne(
          { roomId },
          {
            content,
            language, // Update language field as well
            version: 0,
          },
        );

        logger.info({ event: "room_reset", roomId, userId, language });
      } catch (error) {
        logger.error({ event: "reset_room_error", error: error.message });
      }
    });

    socket.on("cursor-move", ({ roomId, position, name, color }) => {
      // Broadcast to everyone in room EXCEPT sender
      socket.to(roomId).emit("cursor-update", {
        userId,
        name,
        color,
        position,
      });
    });

    socket.on("run-code", async ({ code, language, roomId, runId }) => {
      console.log(`▶ Run code: ${language}, room: ${roomId}, user: ${userId}`);

      if (!code || !code.trim()) {
        socket.emit("output-error", { message: "No code to run", runId });
        return;
      }

      // Emit system message to show execution started
      socket.emit("output-chunk", {
        data: `▶ Running ${language}...\n`,
        type: "system",
        runId,
      });

      await executeCode(
        code,
        language,

        // onChunk — called for each output line
        (chunk) => {
          socket.emit("output-chunk", { data: chunk, type: "output", runId });
        },

        // onEnd — called when execution finishes
        () => {
          console.log("✅ Emitting output-end");
          socket.emit("output-end", { runId });
        },

        // onError — called on execution error
        (message) => {
          console.log("❌ Emitting output-error:", message);
          socket.emit("output-error", { message, runId });
        },
      );
    });

    socket.on("call-initiated", ({ toUserId, type, callId, fromName }) => {
      const recipientSockets = onlineUsers.get(toUserId);
      if (!recipientSockets || recipientSockets.size === 0) {
        socket.emit("call-error", { message: "User is offline" });
        return;
      }
      for (const socketId of recipientSockets) {
        io.to(socketId).emit("incoming-call", {
          fromUserId: userId,
          fromName,
          type,
          callId,
        });
      }
    });

    socket.on("offer", ({ toUserId, offer, callId }) => {
      const sockets = onlineUsers.get(toUserId);
      if (!sockets) return;
      sockets.forEach((id) => {
        io.to(id).emit("offer", { from: userId, offer, callId });
      });
    });

    socket.on("answer", ({ toUserId, answer, callId }) => {
      const sockets = onlineUsers.get(toUserId);
      if (!sockets) return;
      sockets.forEach((id) => {
        io.to(id).emit("answer", { from: userId, answer, callId });
      });
    });

    socket.on("ice-candidate", ({ toUserId, candidate, callId }) => {
      const sockets = onlineUsers.get(toUserId);
      if (!sockets) return;
      for (const socketId of sockets) {
        io.to(socketId).emit("ice-candidate", {
          from: userId,
          candidate,
          callId,
        });
      }
    });

    socket.on("call-accepted", ({ toUserId, callId }) => {
      const sockets = onlineUsers.get(toUserId);
      if (!sockets) return;
      for (const socketId of sockets) {
        io.to(socketId).emit("call-accepted", { fromUserId: userId, callId });
      }
    });

    socket.on("call-rejected", ({ toUserId, callId }) => {
      const sockets = onlineUsers.get(toUserId);
      if (!sockets) return;
      for (const socketId of sockets) {
        io.to(socketId).emit("call-rejected", {
          fromUserId: userId,
          reason: "User declined",
          callId,
        });
      }
    });

    socket.on("call-ended", ({ toUserId, callId } = {}) => {
      if (!toUserId) return;
      const sockets = onlineUsers.get(toUserId);
      if (!sockets) return;
      for (const socketId of sockets) {
        io.to(socketId).emit("call-ended", { fromUserId: userId, callId });
      }
    });

    // ─── DISCONNECT ──────────────────────────────────────────
    socket.on("disconnect", async () => {
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit("cursor-remove", { userId });
        const state = getRoomState(socket.currentRoom);
        if (state) {
          await Room.updateOne(
            { roomId: socket.currentRoom },
            { content: state.content, version: state.version },
          ).catch(() => {});
        }
        socket.to(socket.currentRoom).emit("user-left", { userId });
      }

      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }
    });
  });

  return io;
}
