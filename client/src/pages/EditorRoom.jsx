import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useRoom } from "../hooks/useRoom.js";
import { useOT } from "../hooks/useOT.js";
import MonacoEditor from "../components/Editor/MonacoEditor.jsx";
import EditorToolbar from "../components/Editor/EditorToolbar.jsx";
import OutputPanel from "../components/Editor/OutputPanel.jsx";
import RoomHeader from "../components/Room/RoomHeader.jsx";
import RemoteCursorsOverlay from "../components/Editor/RemoteCursorOverlay.jsx";
import Toast from "../components/Shared/Toast.jsx";
import { useCursors } from "../hooks/useCursors.js";
import { DEFAULT_CODE } from "../utils/languageConfig.js";
import { useWebRTC } from "../hooks/useWebRTC.js";
import { generateCallId } from "../utils/useWebRTCUtils.js";
import { useSessionRecorder } from "../hooks/useSessionRecorder.js";
import CallOverlay from "../components/Call/CallOverlay.jsx";
import IncomingCall from "../components/Call/IncomingCall.jsx";

const EditorRoom = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState(null);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [currentCallId, setCurrentCallId] = useState(null);
  const [currentCallTarget, setCurrentCallTarget] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const { roomId } = useParams();
  const { user, socket } = useAuth();
  const { getRoom } = useRoom();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState(null);
  const editorRef = useRef(null);
  const runIdRef = useRef(null);
  const runSafetyTimer = useRef(null);
  const webRTC = useWebRTC(socket);

  const { isRecording, startRecording, stopRecording, record, isRecordingRef } =
    useSessionRecorder({ roomId, roomName: room?.name, room });

  const { handleChange } = useOT({
    socket,
    roomId,
    editorRef,
    setCode,
    userId: user?._id,
    onOperation: record,
  });

  const myColor =
    room?.participants?.find(
      (p) => p.userId?._id === user?._id || p.userId === user?._id,
    )?.color || "#58a6ff";

  const { handleCursorChange, remoteCursors, clearAllCursors } = useCursors({
    socket,
    roomId,
    user,
    editorRef,
    myColor,
  });

  useEffect(() => {
    setCode("");
    setOutput([]);
    setLanguage("javascript");
    const load = async () => {
      try {
        const data = await getRoom(roomId);
        setRoom(data);
        setLanguage(data.language);
        const initialCode =
          data.content && data.content.trim() !== ""
            ? data.content
            : DEFAULT_CODE[data.language];
        console.log(initialCode);
        setCode(initialCode);

        socket.emit("join-room", { roomId });
      } catch (err) {
        setToast({ message: err.message, type: "error" });
        setTimeout(() => navigate("/dashboard"), 2000);
      } finally {
        setLoading(false);
      }
    };
    load();

    return () => {
      clearAllCursors();
      socket.emit("leave-room", { roomId });
    };
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;

    const onLanguageChanged = ({ language: newLang }) => {
      setLanguage(newLang);
      setToast({ message: `Language changed to ${newLang}`, type: "info" });
    };

    const onRoomReset = ({ language, version, content }) => {
      // Update language when room resets (triggered by owner changing language)
      if (language) {
        setLanguage(language);
        setToast({ message: `Language changed to ${language}`, type: "info" });
      }
    };

    const onUserJoined = ({ name }) => {
      setToast({ message: `${name} joined`, type: "info" });

      getRoom(roomId)
        .then(setRoom)
        .catch(() => {});
    };

    const onUserLeft = () => {
      getRoom(roomId)
        .then(setRoom)
        .catch(() => {});
    };
    const onOutputChunk = ({ data, type, runId }) => {
      if (runId && runId !== runIdRef.current) return;
      const lines = data.split("\n");
      lines.forEach((line) => {
        setOutput((prev) => [...prev, { text: line, type: type || "output" }]);
      });
    };

    const onOutputEnd = ({ runId } = {}) => {
      if (runId && runId !== runIdRef.current) return;
      clearTimeout(runSafetyTimer.current);
      setIsRunning(false);
      setOutput((prev) => [
        ...prev,
        { text: "", type: "output" },
        { text: "── execution complete ──", type: "system" },
      ]);
    };

    const onOutputError = ({ message, runId } = {}) => {
      if (runId && runId !== runIdRef.current) return;
      clearTimeout(runSafetyTimer.current);
      setIsRunning(false);
      setOutput((prev) => [...prev, { text: message, type: "error" }]);
    };

    socket.on("language-changed", onLanguageChanged);
    socket.on("room-reset", onRoomReset);
    socket.on("user-joined", onUserJoined);
    socket.on("user-left", onUserLeft);
    socket.on("output-chunk", onOutputChunk);
    socket.on("output-end", onOutputEnd);
    socket.on("output-error", onOutputError);
    return () => {
      socket.off("language-changed", onLanguageChanged);
      socket.off("room-reset", onRoomReset);
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
      socket.off("output-chunk", onOutputChunk);
      socket.off("output-end", onOutputEnd);
      socket.off("output-error", onOutputError);
    };
  }, [socket, roomId]);

  const handleStartCall = async (type) => {
    // Get other participant's userId
    const otherParticipant = room?.participants?.find((p) => {
      const pId = p.userId?._id || p.userId;
      return pId?.toString() !== user?._id?.toString();
    });

    if (!otherParticipant) {
      setToast({ message: "No other user in room", type: "error" });
      return;
    }

    const toUserId = (
      otherParticipant.userId?._id || otherParticipant.userId
    ).toString();

    try {
      const callId = generateCallId();
      const stream = await webRTC.startLocalStream(type);

      if (stream) {
        setIsCallActive(true);
        setCallType(type);
        setCallStatus("Ringing...");
        setCurrentCallId(callId);
        setCurrentCallTarget(toUserId);

        await webRTC.createOffer(toUserId, callId);

        socket.emit("call-initiated", {
          toUserId,
          fromName: user.name,
          type,
          callId,
        });
      }
    } catch (err) {
      setToast({
        message: "Failed to start call: " + err.message,
        type: "error",
      });
    }
  };

  const handleEndCall = () => {
    webRTC.endCall({ toUserId: currentCallTarget, callId: currentCallId });
    webRTC.stopLocalStream();
    setIsCallActive(false);
    setCallType(null);
    setCallStatus("Connecting...");
    setCurrentCallId(null);
    setCurrentCallTarget(null);
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    try {
      const stream = await webRTC.startLocalStream(incomingCall.type);

      if (stream) {
        setIsCallActive(true);
        setCallType(incomingCall.type);
        setCallStatus("Connecting...");
        setCurrentCallId(incomingCall.callId);
        setCurrentCallTarget(incomingCall.fromUserId);

        socket.emit("call-accepted", {
          toUserId: incomingCall.fromUserId,
          callId: incomingCall.callId,
        });

        setIncomingCall(null);
      }
    } catch (err) {
      setToast({ message: "Failed to accept call", type: "error" });
      setIncomingCall(null);
    }
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    socket.emit("call-rejected", {
      toUserId: incomingCall.fromUserId,
      callId: incomingCall.callId,
    });
    setIncomingCall(null);
  };

  useEffect(() => {
    if (!socket) return;

    const onIncomingCall = (data) => {
      setIncomingCall(data);
    };

    const onOffer = async ({ from, offer, callId }) => {
      if (webRTC.localStream) {
        await webRTC.handleOffer(from, offer, callId, webRTC.localStream);
      }
    };

    const onCallAccepted = ({ callId }) => {
      setCallStatus("Connected");
    };

    const onCallRejected = () => {
      webRTC.stopLocalStream();
      setIsCallActive(false);
      setCallType(null);
      setCurrentCallId(null);
      setCurrentCallTarget(null);
      setToast({ message: "Call rejected", type: "info" });
    };

    const onCallEnded = () => {
      webRTC.stopLocalStream();
      setIsCallActive(false);
      setCallType(null);
      setCallStatus("Connecting...");
      setCurrentCallId(null);
      setCurrentCallTarget(null);
    };

    const onCallError = ({ message }) => {
      setToast({ message, type: "error" });
      setIsCallActive(false);
      webRTC.stopLocalStream();
    };

    socket.on("incoming-call", onIncomingCall);
    socket.on("offer", onOffer);
    socket.on("call-accepted", onCallAccepted);
    socket.on("call-rejected", onCallRejected);
    socket.on("call-ended", onCallEnded);
    socket.on("call-error", onCallError);

    return () => {
      socket.off("incoming-call", onIncomingCall);
      socket.off("offer", onOffer);
      socket.off("call-accepted", onCallAccepted);
      socket.off("call-rejected", onCallRejected);
      socket.off("call-ended", onCallEnded);
      socket.off("call-error", onCallError);
    };
  }, [socket, webRTC]);

  const handleReset = useCallback(() => {
    const boilerplate = DEFAULT_CODE[language];
    setCode(boilerplate);

    socket.emit("reset-room", {
      roomId,
      language,
      content: boilerplate,
    });
  }, [language, socket, roomId]);

  const handleLanguageChange = useCallback(
    (newLang) => {
      // Don't call setCode here - let room-reset event handle it for all users
      // If we call setCode here, Monaco onChange fires and sends operations that corrupt the code
      setLanguage(newLang);

      const boilerplate = DEFAULT_CODE[newLang];

      // Emit reset-room to reset server state and broadcast to all users
      // This ensures all users get the correct boilerplate and synchronized state
      socket.emit("reset-room", {
        roomId,
        language: newLang,
        content: boilerplate,
      });
      record("language", { language: newLang });
    },
    [socket, roomId, record],
  );

  const handleRun = useCallback(() => {
    if (isRunning) return;
    const runId = Date.now().toString();
    runIdRef.current = runId;
    setIsRunning(true);
    setOutput([]);
    socket.emit("run-code", { code, language, roomId, runId });
    clearTimeout(runSafetyTimer.current);
    runSafetyTimer.current = setTimeout(() => {
      if (runIdRef.current === runId) {
        setIsRunning(false);
        setOutput((prev) => [
          ...prev,
          { text: "⚠️ Timed out or connection lost", type: "error" },
        ]);
      }
    }, 15000);
    record("run", { language, timestamp: Date.now() });
  }, [code, language, roomId, socket, isRunning, record]);

  useEffect(() => {
    return () => {
      clearAllCursors();
      socket.emit("leave-room", { roomId });
      if (isRecordingRef.current) {
        stopRecording(code, language);
      }
    };
  }, [roomId]);

  const isOwner = room?.owner?._id === user?._id || room?.owner === user?._id;

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading room...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Incoming call notification */}
      {incomingCall && (
        <IncomingCall
          callerName={incomingCall.fromName}
          callType={incomingCall.type}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Active call overlay */}
      {isCallActive && (
        <CallOverlay
          localStream={webRTC.localStream}
          remoteStream={webRTC.remoteStream}
          callStatus={callStatus}
          callType={callType}
          onEndCall={handleEndCall}
          callerName={currentCallTarget}
        />
      )}

      <RoomHeader
        room={room}
        onCopyId={() => {
          navigator.clipboard.writeText(roomId);
          setToast({ message: "Room ID copied!", type: "success" });
        }}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        code={code}
        language={language}
      />

      <EditorToolbar
        language={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        isRunning={isRunning}
        roomName={room?.name}
        participants={room?.participants}
        isOwner={isOwner}
        onReset={handleReset}
        onAudioCall={() => handleStartCall("audio")}
        onVideoCall={() => handleStartCall("video")}
        isCallActive={isCallActive}
      />

      <div style={styles.main}>
        <div style={{ ...styles.editorPane, position: "relative" }}>
          <MonacoEditor
            content={code}
            language={language}
            onChange={handleChange}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            onCursorChange={handleCursorChange}
          />
          <RemoteCursorsOverlay
            remoteCursors={remoteCursors}
            myName={user?.name}
            myColor={myColor}
          />
        </div>

        <div style={styles.outputPane}>
          <OutputPanel
            output={output}
            isRunning={isRunning}
            onClear={() => setOutput([])}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    background: "#0d1117",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  loading: {
    height: "100vh",
    background: "#0d1117",
    color: "#8b949e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
  },
  editorPane: {
    flex: "0 0 65%",
    minHeight: 0,
    overflow: "hidden",
  },
  outputPane: {
    flex: "0 0 35%",
    minHeight: 0,
    overflow: "hidden",
  },
};

export default EditorRoom;
