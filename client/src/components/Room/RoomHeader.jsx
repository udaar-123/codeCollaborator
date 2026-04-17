import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const RoomHeader = ({
  room,
  onCopyId,
  isRecording,
  startRecording,
  stopRecording,
  code,
  language,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!room) return null;

  const myParticipant = room.participants?.find(
    (p) => p.userId?._id === user?._id || p.userId === user?._id,
  );

  return (
    <div style={styles.header}>
      <div style={styles.left}>
        <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
          ← Back
        </button>
        <div style={styles.divider} />
        <div style={styles.roomInfo}>
          <span style={styles.roomName}>{room.name}</span>
          <span style={styles.roomId} onClick={onCopyId}>
            🔗 {room.roomId}
          </span>
        </div>
      </div>

      {/* Right side mein buttons add karein */}
      <div style={styles.right}>
        {/* --- RECORDING BUTTONS START --- */}
        {isRecording ? (
          <button
            onClick={() => stopRecording(code, language)}
            style={styles.recordingBtn}
          >
            ⏹ Stop Recording
          </button>
        ) : (
          <button onClick={startRecording} style={styles.startRecordBtn}>
            🔴 Record
          </button>
        )}

        {/* --- RECORDING BUTTONS END --- */}
        {myParticipant && (
          <span
            style={{
              ...styles.roleBadge,
              background:
                myParticipant.role === "owner" ? "#2d1b2d" : "#1b2d1b",
              color: myParticipant.role === "owner" ? "#d2a8ff" : "#3fb950",
            }}
          >
            {myParticipant.role}
          </span>
        )}
        <span style={styles.userName}>{user?.name}</span>
      </div>
    </div>
  );
};

const styles = {
  recordingBtn: {
    background: "#da3633",
    color: "white",
    border: "none",
    padding: "4px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
  startRecordBtn: {
    background: "#238636",
    color: "white",
    border: "none",
    padding: "4px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
  header: {
    height: "48px",
    background: "#161b22",
    borderBottom: "1px solid #21262d",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    flexShrink: 0,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#8b949e",
    cursor: "pointer",
    fontSize: "0.85rem",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  divider: {
    width: "1px",
    height: "20px",
    background: "#30363d",
  },
  roomInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  roomName: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#e6edf3",
  },
  roomId: {
    fontSize: "0.78rem",
    color: "#58a6ff",
    fontFamily: "monospace",
    cursor: "copy",
    background: "#0d1117",
    padding: "2px 8px",
    borderRadius: "4px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  roleBadge: {
    fontSize: "0.75rem",
    padding: "2px 10px",
    borderRadius: "20px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  userName: {
    fontSize: "0.85rem",
    color: "#8b949e",
  },
};

export default RoomHeader;
