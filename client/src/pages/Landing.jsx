import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

const Landing = () => {
  const { user } = useAuth()

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.title}>
          Code Together,<br />In Real Time
        </h1>
        <p style={styles.subtitle}>
          Collaborative code editor with live execution,
          multiplayer cursors, and built-in video calls.
        </p>
        <div style={styles.buttons}>
          {user ? (
            <Link to="/dashboard" style={styles.primaryBtn}>
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/register" style={styles.primaryBtn}>
                Get Started Free
              </Link>
              <Link to="/login" style={styles.secondaryBtn}>
                Login
              </Link>
            </>
          )}
        </div>

        {/* Feature highlights */}
        <div style={styles.features}>
          {[
            { icon: "⚡", title: "Real-time Sync", desc: "Every keystroke synced instantly" },
            { icon: "🐳", title: "Run Any Language", desc: "JS, Python, C++ in sandboxed containers" },
            { icon: "📹", title: "Video Calls", desc: "Built-in WebRTC video call" },
            { icon: "🎬", title: "Session Replay", desc: "Record and replay coding sessions" },
          ].map((f) => (
            <div key={f.title} style={styles.featureCard}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0d1117",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  hero: {
    textAlign: "center",
    maxWidth: "800px",
  },
  title: {
    fontSize: "3.5rem",
    fontWeight: "800",
    lineHeight: 1.2,
    marginBottom: "20px",
    background: "linear-gradient(135deg, #58a6ff, #bc8cff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "1.2rem",
    color: "#8b949e",
    marginBottom: "40px",
    lineHeight: 1.6,
  },
  buttons: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    marginBottom: "60px",
  },
  primaryBtn: {
    background: "#58a6ff",
    color: "#000",
    padding: "12px 28px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "1rem",
  },
  secondaryBtn: {
    background: "transparent",
    color: "#58a6ff",
    padding: "12px 28px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "1rem",
    border: "1px solid #58a6ff",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
    textAlign: "left",
  },
  featureCard: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "12px",
    padding: "24px",
  },
  featureIcon: { fontSize: "2rem" },
  featureTitle: { margin: "8px 0 4px", fontSize: "1.1rem" },
  featureDesc: { color: "#8b949e", fontSize: "0.9rem", margin: 0 },
}

export default Landing