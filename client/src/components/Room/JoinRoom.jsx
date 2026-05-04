import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../../hooks/useRoom.js";
import Toast from "../Shared/Toast.jsx";

const JoinRoom = ({ onClose }) => {
  const [roomId, setRoomId] = useState("");
  const [toast, setToast] = useState(null);

  const { joinRoom, loading } = useRoom();
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!roomId.trim()) {
      setToast({ message: "Please enter a room ID", type: "error" });
      return;
    }

    try {
      const room = await joinRoom(roomId.trim());
      navigate(`/room/${room.roomId}`);
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  return (
    <div style={styles.overlay}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Join Room</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.field}>
            <label style={styles.label}>Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID e.g. abc123xyz1"
              style={styles.input}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              autoFocus
            />
            <p style={styles.hint}>
              Ask the room owner to share their Room ID with you
            </p>
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={loading}
            style={{
              ...styles.joinBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Joining..." : "Join Room"}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "440px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #30363d",
  },
  title: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#e6edf3",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#8b949e",
    cursor: "pointer",
    fontSize: "1rem",
  },
  body: { padding: "24px" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "0.9rem", fontWeight: "500", color: "#8b949e" },
  input: {
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#e6edf3",
    fontSize: "0.95rem",
    outline: "none",
  },
  hint: { fontSize: "0.8rem", color: "#484f58", margin: 0 },
  footer: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    padding: "16px 24px",
    borderTop: "1px solid #30363d",
  },
  cancelBtn: {
    background: "transparent",
    border: "1px solid #30363d",
    color: "#8b949e",
    padding: "8px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  joinBtn: {
    background: "#58a6ff",
    border: "none",
    color: "#000",
    padding: "8px 20px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
  },
};

export default JoinRoom;
