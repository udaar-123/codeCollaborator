import { useState, useCallback } from "react"
import { useAuth } from "../context/AuthContext.jsx"

export const useRoom = () => {
  const { API } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createRoom = useCallback(async (name, language, isPublic) => {
    setLoading(true)
    setError(null)
    try {
      const res = await API.post("/api/rooms/create", {
        name, language, isPublic
      })
      return res.data.room
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create room"
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [API])

  const getMyRooms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await API.get("/api/rooms/my")
      return res.data.rooms
    } catch (err) {
      setError("Failed to fetch rooms")
      return []
    } finally {
      setLoading(false)
    }
  }, [API])

  const joinRoom = useCallback(async (roomId) => {
    setLoading(true)
    setError(null)
    try {
      const res = await API.post("/api/rooms/join", { roomId })
      return res.data.room
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to join room"
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [API])

  const getRoom = useCallback(async (roomId) => {
    try {
      const res = await API.get(`/api/rooms/${roomId}`)
      return res.data.room
    } catch (err) {
      throw new Error(err.response?.data?.message || "Room not found")
    }
  }, [API])

  const deleteRoom = useCallback(async (roomId) => {
    try {
      await API.delete(`/api/rooms/${roomId}`)
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to delete room")
    }
  }, [API])

  return {
    createRoom,
    getMyRooms,
    joinRoom,
    getRoom,
    deleteRoom,
    loading,
    error,
  }
}