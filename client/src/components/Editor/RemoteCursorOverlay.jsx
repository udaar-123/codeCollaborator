const RemoteCursorsOverlay = ({ remoteCursors, myName, myColor }) => {
  const cursors = Object.entries(remoteCursors);

  if (cursors.length === 0) return null;

  return (
    <div style={styles.container}>
      {cursors.map(([userId, { name, color }]) => (
        <div key={userId} style={styles.user}>
          <div
            style={{
              ...styles.dot,
              background: color,
            }}
          />
          <span style={styles.name}>{name}</span>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    position: "absolute",
    top: "60px",
    right: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    zIndex: 50,
    pointerEvents: "none",
  },
  user: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(22, 27, 34, 0.9)",
    border: "1px solid #30363d",
    borderRadius: "20px",
    padding: "4px 10px 4px 6px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  name: {
    fontSize: "0.75rem",
    color: "#e6edf3",
    whiteSpace: "nowrap",
  },
};

export default RemoteCursorsOverlay;
