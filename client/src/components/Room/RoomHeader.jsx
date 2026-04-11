import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext.jsx"

const RoomHeader = ({ room, onCopyId }) => {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (!room) return null

  const myParticipant = room.participants?.find(
    p => p.userId?._id === user?._id || p.userId === user?._id
  )

  return (
    <div style={styles.header}>
      {/* Left — back + room info */}
      <div style={styles.left}>
        <button
          onClick={() => navigate("/dashboard")}
          style={styles.backBtn}
          title="Back to dashboard"
        >
          ← Back
        </button>

        <div style={styles.divider} />

        <div style={styles.roomInfo}>
          <span style={styles.roomName}>{room.name}</span>
          <span
            style={styles.roomId}
            onClick={onCopyId}
            title="Click to copy Room ID"
          >
            🔗 {room.roomId}
          </span>
        </div>
      </div>

      {/* Right — role badge + user name */}
      <div style={styles.right}>
        {myParticipant && (
          <span style={{
            ...styles.roleBadge,
            background: myParticipant.role === "owner"
              ? "#2d1b2d"
              : myParticipant.role === "editor"
              ? "#1b2d1b"
              : "#1b2433",
            color: myParticipant.role === "owner"
              ? "#d2a8ff"
              : myParticipant.role === "editor"
              ? "#3fb950"
              : "#58a6ff",
          }}>
            {myParticipant.role}
          </span>
        )}
        <span style={styles.userName}>{user?.name}</span>
      </div>
    </div>
  )
}

const styles = {
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
}

export default RoomHeader