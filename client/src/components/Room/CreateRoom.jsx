import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRoom } from "../../hooks/useRoom.js"
import Toast from "../shared/Toast.jsx"

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python",     label: "Python" },
  { value: "cpp",        label: "C++" },
  { value: "java",       label: "Java" },
  { value: "typescript", label: "TypeScript" },
]

const CreateRoom = ({ onClose }) => {
  const [name, setName] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [isPublic, setIsPublic] = useState(true)
  const [toast, setToast] = useState(null)

  const { createRoom, loading } = useRoom()
  const navigate = useNavigate()

  const handleCreate = async () => {
    if (!name.trim()) {
      setToast({ message: "Room name is required", type: "error" })
      return
    }

    try {
      const room = await createRoom(name, language, isPublic)
      navigate(`/room/${room.roomId}`)  // go directly to editor
    } catch (err) {
      setToast({ message: err.message, type: "error" })
    }
  }

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
          <h2 style={styles.title}>Create Room</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.body}>
          {/* Room Name */}
          <div style={styles.field}>
            <label style={styles.label}>Room Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My coding session"
              style={styles.input}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>

          {/* Language */}
          <div style={styles.field}>
            <label style={styles.label}>Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={styles.select}
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Public/Private toggle */}
          <div style={styles.toggleRow}>
            <div>
              <p style={styles.label}>Public Room</p>
              <p style={styles.hint}>Anyone with the room ID can join</p>
            </div>
            <div
              onClick={() => setIsPublic(!isPublic)}
              style={{
                ...styles.toggle,
                background: isPublic ? "#238636" : "#30363d",
              }}
            >
              <div style={{
                ...styles.toggleThumb,
                transform: isPublic ? "translateX(20px)" : "translateX(2px)",
              }} />
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              ...styles.createBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating..." : "Create Room"}
          </button>
        </div>
      </div>
    </div>
  )
}

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
    overflow: "hidden",
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
    padding: "4px",
  },
  body: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#8b949e",
    margin: 0,
  },
  hint: {
    fontSize: "0.8rem",
    color: "#484f58",
    margin: "2px 0 0",
  },
  input: {
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#e6edf3",
    fontSize: "0.95rem",
    outline: "none",
  },
  select: {
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#e6edf3",
    fontSize: "0.95rem",
    outline: "none",
    cursor: "pointer",
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggle: {
    width: "44px",
    height: "24px",
    borderRadius: "12px",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
    flexShrink: 0,
  },
  toggleThumb: {
    position: "absolute",
    top: "2px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#fff",
    transition: "transform 0.2s",
  },
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
  createBtn: {
    background: "#238636",
    border: "none",
    color: "#fff",
    padding: "8px 20px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
  },
}

export default CreateRoom