import { LANGUAGES } from "../../utils/languageConfig.js"

const EditorToolbar = ({
  language,
  onLanguageChange,
  onRun,
  isRunning,
  roomName,
  participants,
  isOwner,
}) => {
  return (
    <div style={styles.toolbar}>
     
      <div style={styles.left}>
        <span style={styles.roomName}>{roomName}</span>

      
        <div style={styles.participants}>
          {participants?.slice(0, 5).map((p, i) => (
            <div
              key={p.userId?._id || i}
              title={p.userId?.name || "User"}
              style={{
                ...styles.avatar,
                background: p.color || "#58a6ff",
                marginLeft: i === 0 ? 0 : -8,
                zIndex: participants.length - i,
              }}
            >
              {(p.userId?.name || "U")[0].toUpperCase()}
            </div>
          ))}
        </div>
      </div>

    
      <div style={styles.center}>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          style={styles.select}
          disabled={!isOwner}  
          title={!isOwner ? "Only the owner can change language" : ""}
        >
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>
              {l.icon} {l.label}
            </option>
          ))}
        </select>
      </div>
2
      <div style={styles.right}>
        <button
          onClick={onRun}
          disabled={isRunning}
          style={{
            ...styles.runBtn,
            opacity: isRunning ? 0.7 : 1,
            cursor: isRunning ? "not-allowed" : "pointer",
          }}
        >
          {isRunning ? "⏳ Running..." : "▶ Run"}
        </button>
      </div>
    </div>
  )
}

const styles = {
  toolbar: {
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
    flex: 1,
  },
  roomName: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#e6edf3",
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  participants: {
    display: "flex",
    alignItems: "center",
  },
  avatar: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.7rem",
    fontWeight: "700",
    color: "#fff",
    border: "2px solid #161b22",
    cursor: "default",
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  select: {
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "6px",
    color: "#e6edf3",
    padding: "4px 10px",
    fontSize: "0.85rem",
    cursor: "pointer",
    outline: "none",
  },
  right: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
  runBtn: {
    background: "#238636",
    border: "none",
    color: "#fff",
    padding: "6px 18px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
}

export default EditorToolbar