const PlaybackControls = ({
  isPlaying,
  currentTime,
  duration,
  speed,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onSpeedChange,
}) => {
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={styles.container}>
      {/* Play/Pause/Stop buttons */}
      <div style={styles.buttons}>
        <button onClick={isPlaying ? onPause : onPlay} style={styles.playBtn}>
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button onClick={onStop} style={styles.stopBtn}>
          ⏹
        </button>
      </div>

      {/* Progress bar */}
      <div style={styles.progressContainer}>
        <span style={styles.time}>{formatTime(currentTime)}</span>

        <div
          style={styles.progressBar}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const ratio = x / rect.width;
            onSeek(ratio * duration);
          }}
        >
          <div
            style={{
              ...styles.progressFill,
              width: `${progress}%`,
            }}
          />
          {/* Scrub handle */}
          <div
            style={{
              ...styles.scrubHandle,
              left: `${progress}%`,
            }}
          />
        </div>

        <span style={styles.time}>{formatTime(duration)}</span>
      </div>

      {/* Speed selector */}
      <select
        value={speed}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
        style={styles.speedSelect}
      >
        <option value={0.5}>0.5x</option>
        <option value={1}>1x</option>
        <option value={2}>2x</option>
        <option value={4}>4x</option>
      </select>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 16px",
    background: "#161b22",
    borderBottom: "1px solid #21262d",
  },
  buttons: {
    display: "flex",
    gap: "6px",
  },
  playBtn: {
    background: "#238636",
    border: "none",
    color: "#fff",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  stopBtn: {
    background: "#30363d",
    border: "none",
    color: "#e6edf3",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  progressContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  progressBar: {
    flex: 1,
    height: "4px",
    background: "#30363d",
    borderRadius: "2px",
    cursor: "pointer",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    background: "#58a6ff",
    borderRadius: "2px",
    transition: "width 0.1s linear",
  },
  scrubHandle: {
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "12px",
    height: "12px",
    background: "#58a6ff",
    borderRadius: "50%",
    cursor: "grab",
  },
  time: {
    fontSize: "0.75rem",
    color: "#8b949e",
    fontFamily: "monospace",
    whiteSpace: "nowrap",
  },
  speedSelect: {
    background: "#0d1117",
    border: "1px solid #30363d",
    color: "#e6edf3",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
};

export default PlaybackControls;
