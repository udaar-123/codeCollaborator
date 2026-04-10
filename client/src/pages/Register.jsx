import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import Toast from "../components/Shared/Toast.jsx"

const Register = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name || !email || !password) {
      setToast({ message: "Please fill all fields", type: "error" })
      return
    }

    if (password.length < 6) {
      setToast({ message: "Password must be at least 6 characters", type: "error" })
      return
    }

    setLoading(true)
    try {
      await register(name, email, password)
      navigate("/dashboard")
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed"
      setToast({ message, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={styles.card}>
        <h1 style={styles.title}>Create account</h1>
        <p style={styles.subtitle}>Start coding together</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

// Same styles as Login
const styles = {
  container: {
    minHeight: "100vh",
    background: "#0d1117",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "12px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#e6edf3",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#8b949e",
    marginBottom: "32px",
    fontSize: "0.95rem",
  },
  form: {
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
    color: "#8b949e",
    fontWeight: "500",
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
  button: {
    background: "#238636",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "1rem",
    fontWeight: "600",
    marginTop: "8px",
  },
  footer: {
    textAlign: "center",
    marginTop: "24px",
    color: "#8b949e",
    fontSize: "0.9rem",
  },
  link: {
    color: "#58a6ff",
    fontWeight: "500",
  },
}

export default Register