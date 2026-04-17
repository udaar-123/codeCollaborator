const IncomingCall = ({ callerName, callType, onAccept, onReject }) => {
  return (
    <div style={styles.container}>
      <div style={styles.info}>
        <span style={styles.icon}>{callType === "video" ? "📹" : "📞"}</span>
        <div>
          <p style={styles.caller}>{callerName}</p>
          <p style={styles.type}>
            Incoming {callType === "video" ? "video" : "audio"} call
          </p>
        </div>
      </div>

      <div style={styles.actions}>
        <button onClick={onReject} style={styles.rejectBtn}>
          📵
        </button>
        <button onClick={onAccept} style={styles.acceptBtn}>
          {callType === "video" ? "📹" : "📞"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "12px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    zIndex: 2000,
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    minWidth: "300px",
  },
  info: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  icon: { fontSize: "1.8rem" },
  caller: {
    color: "#e6edf3",
    fontWeight: "600",
    fontSize: "0.95rem",
    margin: 0,
  },
  type: {
    color: "#8b949e",
    fontSize: "0.8rem",
    margin: 0,
  },
  actions: {
    display: "flex",
    gap: "12px",
  },
  rejectBtn: {
    background: "#da3633",
    border: "none",
    color: "#fff",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "1.1rem",
  },
  acceptBtn: {
    background: "#238636",
    border: "none",
    color: "#fff",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "1.1rem",
  },
};

export default IncomingCall;
