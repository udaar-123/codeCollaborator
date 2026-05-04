import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSessionPlayer } from "../hooks/useSessionPlayer.js";
import MonacoEditor from "../components/Editor/MonacoEditor.jsx";
import PlaybackControls from "../components/Playback/PlaybackControl.jsx";
import Toast from "../components/Shared/Toast.jsx";
import { applyOp } from "../utils/ot.js";
import { DEFAULT_CODE } from "../utils/languageConfig.js";

const SessionReplay = () => {
  const { sessionId } = useParams();
  const { API } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [toast, setToast] = useState(null);
  const [runOutput, setRunOutput] = useState(null);

  const editorRef = useRef(null);
  const codeRef = useRef(""); // track code without re-renders
  const player = useSessionPlayer();

  // Load session on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get(`/api/sessions/${sessionId}`);
        const s = res.data.session;
        setSession(s);
        setLanguage(s.language || "javascript");

        // Start with empty editor — playback fills it
        setCode("");
        codeRef.current = "";
      } catch (err) {
        setToast({ message: "Session not found", type: "error" });
        setTimeout(() => navigate("/dashboard"), 2000);
      } finally {
        setLoading(false);
      }
    };
    load();

    return () => player.stop();
  }, [sessionId]);

  // Apply a single event to the editor
  const applyEvent = useCallback((event) => {
    const editor = editorRef.current;

    switch (event.type) {
      case "operation": {
        // Apply OT operation to editor
        const newCode = applyOp(codeRef.current, event.data);
        codeRef.current = newCode;
        setCode(newCode);

        // Apply directly to Monaco model
        if (editor) {
          const range = getMonacoRange(editor, event.data);
          if (range) {
            editor.executeEdits("playback", [
              {
                range,
                text: event.data.type === "insert" ? event.data.text : "",
                forceMoveMarkers: true,
              },
            ]);
          }
        }
        break;
      }

      case "language": {
        setLanguage(event.data.language);
        // Reset code when language changes
        const defaultCode = DEFAULT_CODE[event.data.language] || "";
        codeRef.current = defaultCode;
        setCode(defaultCode);
        break;
      }

      case "run": {
        setRunOutput(event.data);
        break;
      }

      default:
        break;
    }
  }, []);

  const handlePlay = useCallback(() => {
    if (!session) return;

    // Reset to beginning before playing
    setCode("");
    codeRef.current = "";

    player.playFrom(
      session.events,
      player.currentTime,
      session.duration,
      applyEvent,
      () => console.log("Playback complete"),
    );
  }, [session, player, applyEvent]);

  const handlePause = useCallback(() => {
    player.pause();
  }, [player]);

  const handleStop = useCallback(() => {
    player.stop();
    setCode("");
    codeRef.current = "";
    setRunOutput(null);
  }, [player]);

  const handleSeek = useCallback(
    (targetMs) => {
      if (!session) return;

      // Reset editor
      setCode("");
      codeRef.current = "";

      player.seekTo(
        targetMs,
        session.events,
        session.duration,
        applyEvent,
        () => {},
      );
    },
    [session, player, applyEvent],
  );

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading session...</p>
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

      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
          ← Back
        </button>
        <div style={styles.sessionInfo}>
          <span style={styles.sessionTitle}>🎬 Session Replay</span>
          <span style={styles.sessionMeta}>
            {session?.roomName} · {formatDuration(session?.duration)}
          </span>
        </div>
        <span style={styles.language}>{language}</span>
      </div>

      {/* Playback controls */}
      <PlaybackControls
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={session?.duration || 0}
        speed={player.speed}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onSeek={handleSeek}
        onSpeedChange={player.setSpeed}
      />

      {/* Editor — read only during playback */}
      <div style={styles.editorContainer}>
        <MonacoEditor
          content={code}
          language={language}
          readOnly={true}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>

      {/* Show run output if a run event played */}
      {runOutput && (
        <div style={styles.outputContainer}>
          <div style={styles.outputHeader}>
            <span>Output</span>
            <button onClick={() => setRunOutput(null)} style={styles.clearBtn}>
              Clear
            </button>
          </div>
          <pre style={styles.output}>{runOutput.output}</pre>
        </div>
      )}
    </div>
  );
};

const formatDuration = (ms) => {
  if (!ms) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const getMonacoRange = (editor, op) => {
  const model = editor.getModel();
  if (!model) return null;
  if (op.type === "insert") {
    const pos = model.getPositionAt(op.position);
    return {
      startLineNumber: pos.lineNumber,
      startColumn: pos.column,
      endLineNumber: pos.lineNumber,
      endColumn: pos.column,
    };
  }
  if (op.type === "delete") {
    const s = model.getPositionAt(op.position);
    const e = model.getPositionAt(op.position + op.length);
    return {
      startLineNumber: s.lineNumber,
      startColumn: s.column,
      endLineNumber: e.lineNumber,
      endColumn: e.column,
    };
  }
  return null;
};

const styles = {
  container: {
    height: "100vh",
    background: "#0d1117",
    color: "#e6edf3",
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
  header: {
    height: "48px",
    background: "#161b22",
    borderBottom: "1px solid #21262d",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    gap: "16px",
    flexShrink: 0,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#8b949e",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  sessionInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  sessionTitle: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#e6edf3",
  },
  sessionMeta: {
    fontSize: "0.75rem",
    color: "#8b949e",
  },
  language: {
    fontSize: "0.8rem",
    color: "#58a6ff",
    background: "#0d1117",
    padding: "2px 10px",
    borderRadius: "20px",
    border: "1px solid #30363d",
  },
  editorContainer: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  outputContainer: {
    height: "150px",
    borderTop: "1px solid #21262d",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  outputHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 16px",
    background: "#161b22",
    fontSize: "0.85rem",
    borderBottom: "1px solid #21262d",
  },
  clearBtn: {
    background: "none",
    border: "1px solid #30363d",
    color: "#8b949e",
    padding: "2px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.75rem",
  },
  output: {
    flex: 1,
    overflow: "auto",
    padding: "12px 16px",
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#e6edf3",
    margin: 0,
  },
};

export default SessionReplay;
