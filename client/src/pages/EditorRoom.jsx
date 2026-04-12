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
import Toast from "../components/shared/Toast.jsx";
import { useCursors } from "../hooks/useCursors.js";
import { DEFAULT_CODE } from "../utils/languageConfig.js";

const EditorRoom = () => {
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
  const { handleChange } = useOT({
    socket,
    roomId,
    editorRef,
    setCode,
    userId: user?._id,
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
    const load = async () => {
      try {
        const data = await getRoom(roomId);
        setRoom(data);
        setLanguage(data.language);
        const initialCode =
          data.content && data.content.trim() !== ""
            ? data.content
            : DEFAULT_CODE[data.language];
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
      setCode(DEFAULT_CODE[newLang]);
      setToast({ message: `Language changed to ${newLang}`, type: "info" });
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
    socket.on("user-joined", onUserJoined);
    socket.on("user-left", onUserLeft);
    socket.on("output-chunk", onOutputChunk);
    socket.on("output-end", onOutputEnd);
    socket.on("output-error", onOutputError);
    return () => {
      socket.off("language-changed", onLanguageChanged);
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
      socket.off("output-chunk", onOutputChunk);
      socket.off("output-end", onOutputEnd);
      socket.off("output-error", onOutputError);
    };
  }, [socket, roomId]);

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
      setLanguage(newLang);
      setCode(DEFAULT_CODE[newLang]);
      socket.emit("language-change", { roomId, language: newLang });
    },
    [socket, roomId],
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
  }, [code, language, roomId, socket, isRunning]);

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

      <RoomHeader
        room={room}
        onCopyId={() => {
          navigator.clipboard.writeText(roomId);
          setToast({ message: "Room ID copied!", type: "success" });
        }}
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
