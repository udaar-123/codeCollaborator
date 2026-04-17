import { useEffect, useRef } from "react";

const CallOverlay = ({
  localStream,
  remoteStream,
  callStatus,
  callType,
  onEndCall,
  callerName,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div style={styles.overlay}>
      {/* Main remote video */}
      <div style={styles.remoteVideo}>
        {callType === "video" && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={styles.video}
          />
        ) : (
          <div style={styles.audioPlaceholder}>
            <span style={styles.audioIcon}>🎙️</span>
            <p style={styles.callerName}>{callerName || "User"}</p>
            <p style={styles.callStatus}>{callStatus}</p>
          </div>
        )}
      </div>

      {/* Local video — picture in picture */}
      {callType === "video" && localStream && (
        <div style={styles.localVideo}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted // muted to prevent echo
            style={styles.video}
          />
        </div>
      )}

      {/* Call controls */}
      <div style={styles.controls}>
        <p style={styles.statusText}>{callStatus}</p>
        <button onClick={onEndCall} style={styles.endBtn}>
          📵 End Call
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: "60px",
    right: "20px",
    width: "320px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "12px",
    overflow: "hidden",
    zIndex: 1000,
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  remoteVideo: {
    width: "100%",
    height: "180px",
    background: "#0d1117",
    position: "relative",
  },
  localVideo: {
    position: "absolute",
    bottom: "60px",
    right: "8px",
    width: "80px",
    height: "60px",
    borderRadius: "6px",
    overflow: "hidden",
    border: "2px solid #30363d",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  audioPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  audioIcon: { fontSize: "2rem" },
  callerName: {
    color: "#e6edf3",
    fontSize: "1rem",
    fontWeight: "600",
    margin: 0,
  },
  callStatus: {
    color: "#8b949e",
    fontSize: "0.85rem",
    margin: 0,
  },
  controls: {
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid #21262d",
  },
  statusText: {
    color: "#8b949e",
    fontSize: "0.8rem",
    margin: 0,
  },
  endBtn: {
    background: "#da3633",
    border: "none",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
};

export default CallOverlay;
