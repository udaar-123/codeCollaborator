import { useRef, useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export const useSessionRecorder = ({ roomId, roomName, room }) => {
  const { API } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const eventsRef = useRef([]);
  const startTimeRef = useRef(null);

  const record = useCallback((type, data) => {
    console.log(
      "record() called →",
      type,
      "| isRecording:",
      isRecordingRef.current,
      "| events so far:",
      eventsRef.current.length,
    );
    if (!isRecordingRef.current || !startTimeRef.current) return;
    console.log(`⏺ Recording event: ${type}`);
    eventsRef.current.push({
      type,
      data,
      t: Date.now() - startTimeRef.current,
    });
  }, []);

  const startRecording = useCallback(() => {
    eventsRef.current = [];
    startTimeRef.current = Date.now();
    isRecordingRef.current = true;
    setIsRecording(true);
    console.log("🔴 Recording started");
  }, []);

  const stopRecording = useCallback(
    async (finalCode, language) => {
      if (!finalCode || !language)
        console.log("both finalCode and language required");
      if (!isRecordingRef.current) return null;
      isRecordingRef.current = false;
      setIsRecording(false);
      const duration = Date.now() - startTimeRef.current;
      if (eventsRef.current.length === 0) {
        console.warn("⚠️ No events recorded — session not saved");
        return null;
      }

      const sessionData = {
        roomId,
        roomName,
        events: eventsRef.current,
        finalCode,
        language,
        duration,
        participants: room?.participants?.map((p) => ({
          userId: p.userId?._id || p.userId,
          name: p.userId?.name || "Unknown",
          color: p.color,
        })),
        startedAt: new Date(startTimeRef.current).toISOString(),
        endedAt: new Date().toISOString(),
      };

      console.log("📦 Saving session:", {
        sessionData,
      });

      try {
        const res = await API.post("/api/sessions/save", sessionData);
        console.log("✅ Session saved:", res.data.session._id);
        return res.data.session;
      } catch (err) {
        console.error("❌ Failed to save session:", err.message);
        return null;
      }
    },
    [roomId, roomName, room, API],
  );

  return {
    isRecording,
    startRecording,
    stopRecording,
    record,
    isRecordingRef,
  };
};
