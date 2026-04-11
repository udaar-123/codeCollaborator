import { Server } from "socket.io"
import logger from '../utils/logger.js'
import { verifySocketToken } from '../middlewares/verifySocketToken.js'
import Room from '../models/room.schema.js'
import { transform, applyOp } from '../services/ot.service.js'
import { initRoomState, getRoomState, updateRoomState, getOperationsSince } from '../services/room.service.js'

export const onlineUsers = new Map()

export function initServer(server){
    const io = new Server(server,{
        cors:{
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            credentials: true
        }
    })
    
    io.use(verifySocketToken)
    
    io.on("connection", (socket) => {
        const userId = socket.user._id.toString()
        
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set())
        }
        onlineUsers.get(userId).add(socket.id)
        
        logger.info(`User ${userId} connected with socket ${socket.id}`)
        
        // ─── JOIN ROOM ───────────────────────────────────────────
        socket.on("join-room", async ({ roomId }) => {
            try {
                const room = await Room.findOne({ roomId })
                    .populate("participants.userId", "name email avatar")
                if (!room) return socket.emit("error", "Room not found")

                // Leave previous rooms
                Array.from(socket.rooms)
                    .filter(r => r !== socket.id)
                    .forEach(r => socket.leave(r))

                socket.join(roomId)
                socket.currentRoom = roomId

                // Init room state from DB if not already in memory
                const existing = getRoomState(roomId)
                if (!existing) {
                    initRoomState(roomId, room.content || "", room.version || 0)
                }

                const state = getRoomState(roomId)

                // Send current state to joining user
                socket.emit("room-state", {
                    content: state.content,
                    version: state.version,
                    language: room.language,
                    participants: room.participants,
                })

                // Tell others this user joined
                socket.to(roomId).emit("user-joined", {
                    userId,
                    name: socket.user.name,
                })

                logger.info({ event: "room_joined", userId, roomId })
            } catch (error) {
                socket.emit("error", "Failed to join room")
                logger.error({ event: "join_room_error", error: error.message })
            }
        })

        // ─── OPERATION ─────────────────────
        socket.on("operation", async ({ roomId, op, version }) => {
            try {
                const state = getRoomState(roomId)
                if (!state) return

                // Get all ops that happened after client's version
                const concurrentOps = getOperationsSince(roomId, version)

                // Transform incoming op against all concurrent ops
                let transformedOp = op
                for (const serverOp of concurrentOps) {
                    transformedOp = transform(serverOp, transformedOp)
                }

                // Apply transformed op to server document
                const newContent = applyOp(state.content, transformedOp)
                updateRoomState(roomId, newContent, transformedOp)

                const updatedState = getRoomState(roomId)

                // Send transformed op back to ALL users in room
                io.to(roomId).emit("operation", {
                    op: transformedOp,
                    version: updatedState.version,
                    userId,
                })

                // Periodically save content to DB (every 10 ops)
                if (updatedState.version % 10 === 0) {
                    await Room.updateOne(
                        { roomId },
                        {
                            content: updatedState.content,
                            version: updatedState.version
                        }
                    )
                }
            } catch (error) {
                logger.error({ event: "operation_error", error: error.message })
            }
        })

        // ─── LEAVE ROOM ──────────────────────────────────────────
        socket.on("leave-room", ({ roomId }) => {
            socket.leave(roomId)
            socket.to(roomId).emit("user-left", { userId })
        })

        // ─── LANGUAGE CHANGE ─────────────────────────────────────
        socket.on("language-change", ({ roomId, language }) => {
            socket.to(roomId).emit("language-changed", { language })
        })

        // ─── RESET ROOM ───────────────────────────────────────────
        socket.on("reset-room", async ({ roomId, language, content }) => {
            try {
                const state = getRoomState(roomId)
                if (!state) return

                // Update in-memory state with boilerplate
                state.content = content
                state.version = 0
                state.operations = []

                // Broadcast reset to all users in room
                io.to(roomId).emit("room-reset", {
                    content,
                    version: 0,
                    language,
                })

                // Save to DB immediately
                await Room.updateOne(
                    { roomId },
                    {
                        content,
                        version: 0,
                    }
                )

                logger.info({ event: "room_reset", roomId, userId })
            } catch (error) {
                logger.error({ event: "reset_room_error", error: error.message })
            }
        })

        // ─── DISCONNECT ──────────────────────────────────────────
        socket.on("disconnect", async () => {
            if (socket.currentRoom) {
                const state = getRoomState(socket.currentRoom)
                if (state) {
                    await Room.updateOne(
                        { roomId: socket.currentRoom },
                        { content: state.content, version: state.version }
                    ).catch(() => {})
                }
                socket.to(socket.currentRoom).emit("user-left", { userId })
            }

            const sockets = onlineUsers.get(userId)
            if (sockets) {
                sockets.delete(socket.id)
                if (sockets.size === 0) onlineUsers.delete(userId)
            }
        })
    })

    return io
}
