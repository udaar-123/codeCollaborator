import { useState, useEffect } from "react"
const Toast = ({ message, type = "error", onClose = ()=>{} }) => {
  useEffect(() => {

    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const colors = {
    error:   { bg: "#2d1b1b", border: "#f85149", text: "#f85149" },
    success: { bg: "#1b2d1b", border: "#3fb950", text: "#3fb950" },
    info:    { bg: "#1b2433", border: "#58a6ff", text: "#58a6ff" },
  }

  const color = colors[type]

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      background: color.bg,
      border: `1px solid ${color.border}`,
      color: color.text,
      padding: "12px 20px",
      borderRadius: "8px",
      fontSize: "14px",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      gap: "12px",
      maxWidth: "360px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: color.text,
          cursor: "pointer",
          fontSize: "16px",
          padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}

export default Toast