import { useRef, useEffect } from "react"
const OutputPanel = ({ output, isRunning, onClear }) => {
  const bottomRef = useRef(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [output])
  return (
    <div style={styles.container}>
      {/* Output header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.title}>Output</span>
          {isRunning && (
            <span style={styles.runningBadge}>● Running</span>
          )}
        </div>
        <button
          onClick={onClear}
          style={styles.clearBtn}
          title="Clear output"
        >
          Clear
        </button>
      </div>

      {/* Output content */}
      <div style={styles.output}>
        {output.length === 0 ? (
          <span style={styles.placeholder}>
            Click ▶ Run to execute your code...
          </span>
        ) : (
          output.map((line, i) => (
            <div
              key={i}
              style={{
                ...styles.line,
                color: line.type === "error"   ? "#f85149" :
                       line.type === "system"  ? "#8b949e" :
                       "#e6edf3"
              }}
            >
              {line.text}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

const styles = {
  container: {
    height: "100%",
    background: "#0d1117",
    display: "flex",
    flexDirection: "column",
    borderTop: "1px solid #21262d",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 16px",
    borderBottom: "1px solid #21262d",
    background: "#161b22",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  title: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#e6edf3",
  },
  runningBadge: {
    fontSize: "0.75rem",
    color: "#3fb950",
    animation: "pulse 1s infinite",
  },
  clearBtn: {
    background: "none",
    border: "1px solid #30363d",
    color: "#8b949e",
    padding: "3px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.78rem",
  },
  output: {
    flex: 1,
    overflow: "auto",
    padding: "12px 16px",
    fontFamily: "'Fira Code', Consolas, monospace",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  line: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
  placeholder: {
    color: "#484f58",
    fontStyle: "italic",
  },
}

export default OutputPanel