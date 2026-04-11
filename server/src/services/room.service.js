// In-memory room state
// Stores current content + operation history per room
// Redis backup added later for persistence

const roomStates = new Map()
// Structure:
// roomId → {
//   content: string,
//   version: number,
//   operations: [{ ...op, version }]
// }

export const getRoomState = (roomId) => {
  return roomStates.get(roomId)
}

export const initRoomState = (roomId, content = "", version = 0) => {
  if (!roomStates.has(roomId)) {
    roomStates.set(roomId, {
      content,
      version,
      operations: [],   // full operation history
    })
  }
  return roomStates.get(roomId)
}

export const updateRoomState = (roomId, newContent, op) => {
  const state = roomStates.get(roomId)
  if (!state) return

  state.content = newContent
  state.version++
  state.operations.push({ ...op, version: state.version })

  // Keep only last 1000 operations to prevent memory bloat
  if (state.operations.length > 1000) {
    state.operations = state.operations.slice(-500)
  }
}

export const getOperationsSince = (roomId, version) => {
  const state = roomStates.get(roomId)
  if (!state) return []
  return state.operations.filter(op => op.version > version)
}

export const clearRoomState = (roomId) => {
  roomStates.delete(roomId)
}