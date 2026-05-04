import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useRoom } from "../hooks/useRoom.js";
import CreateRoom from "../components/Room/CreateRoom.jsx";
import JoinRoom from "../components/Room/JoinRoom.jsx";
import Toast from "../components/Shared/Toast.jsx";

const LANGUAGE_ICONS = {
  javascript: "🟨",
  python: "🐍",
  cpp: "⚙️",
  java: "☕",
  typescript: "🔷",
};

const Dashboard = () => {
  const { user, logout, API } = useAuth();
  const { getMyRooms, deleteRoom, loading } = useRoom();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [toast, setToast] = useState(null);

  // Load rooms on mount
  useEffect(() => {
    const load = async () => {
      const data = await getMyRooms();
      setRooms(data);
    };
    load();
  }, []);

  const handleDelete = async (roomId, e) => {
    e.stopPropagation(); // prevent navigating to room
    if (!confirm("Delete this room?")) return;

    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.roomId !== roomId));
      setToast({ message: "Room deleted", type: "success" });
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modals */}
      {showCreate && <CreateRoom onClose={() => setShowCreate(false)} />}
      {showJoin && <JoinRoom onClose={() => setShowJoin(false)} />}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          {"</>"}
          <span style={styles.logoText}>CodeCollab</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>👋 {user?.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.main}>
        {/* Page title + action buttons */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>My Rooms</h1>
            <p style={styles.pageSubtitle}>
              {rooms.length} room{rooms.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={styles.actions}>
            <button onClick={() => setShowJoin(true)} style={styles.joinBtn}>
              Join Room
            </button>
            <button
              onClick={() => setShowCreate(true)}
              style={styles.createBtn}
            >
              + New Room
            </button>
          </div>
        </div>

        {/* Room list */}
        {loading ? (
          <div style={styles.center}>Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>🖥️</p>
            <h3 style={styles.emptyTitle}>No rooms yet</h3>
            <p style={styles.emptyText}>
              Create a new room or join an existing one
            </p>
            <button
              onClick={() => setShowCreate(true)}
              style={styles.createBtn}
            >
              + Create your first room
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {rooms.map((room) => (
              <div
                key={room.roomId}
                onClick={() => navigate(`/room/${room.roomId}`)}
                style={styles.card}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#58a6ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#30363d")
                }
              >
                {/* Card header */}
                <div style={styles.cardHeader}>
                  <span style={styles.langIcon}>
                    {LANGUAGE_ICONS[room.language] || "📄"}
                  </span>
                  <div style={styles.cardBadges}>
                    <span style={styles.langBadge}>{room.language}</span>
                    {!room.isPublic && (
                      <span style={styles.privateBadge}>🔒 Private</span>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <h3 style={styles.cardTitle}>{room.name}</h3>
                <p style={styles.cardMeta}>
                  {room.participants?.length || 1} participant
                  {(room.participants?.length || 1) !== 1 ? "s" : ""}
                  {" · "}
                  {formatDate(room.updatedAt)}
                </p>

                {/* Room ID — click to copy */}
                <div
                  style={styles.roomId}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(room.roomId);
                    setToast({ message: "Room ID copied!", type: "success" });
                  }}
                  title="Click to copy Room ID"
                >
                  🔗 {room.roomId}
                </div>

                <div
                  style={styles.sessionLink}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const res = await API.get(
                      `/api/sessions/room/${room.roomId}`,
                    );
                    const sessions = res.data.sessions;
                    if (sessions.length > 0) {
                      navigate(`/session/${sessions[0]._id}`);
                    } else {
                      setToast({ message: "No recordings yet", type: "info" });
                    }
                  }}
                >
                  🎬 View recordings
                </div>

                {/* Delete button — only for owner */}
                {room.owner?._id === user?._id || room.owner === user?._id ? (
                  <button
                    onClick={(e) => handleDelete(room.roomId, e)}
                    style={styles.deleteBtn}
                    title="Delete room"
                  >
                    🗑️
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0d1117",
    color: "#e6edf3",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    borderBottom: "1px solid #21262d",
    background: "#161b22",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "1.2rem",
    fontWeight: "700",
    color: "#58a6ff",
  },
  logoText: { color: "#e6edf3" },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  userName: { color: "#8b949e", fontSize: "0.9rem" },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #30363d",
    color: "#8b949e",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  main: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "40px 32px",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
  },
  pageTitle: {
    fontSize: "1.8rem",
    fontWeight: "700",
    margin: "0 0 4px",
  },
  pageSubtitle: {
    color: "#8b949e",
    fontSize: "0.9rem",
    margin: 0,
  },
  actions: { display: "flex", gap: "12px" },
  joinBtn: {
    background: "transparent",
    border: "1px solid #30363d",
    color: "#e6edf3",
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
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
  },
  center: {
    textAlign: "center",
    color: "#8b949e",
    padding: "60px",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    color: "#8b949e",
  },
  emptyIcon: { fontSize: "3rem", margin: "0 0 16px" },
  emptyTitle: {
    fontSize: "1.2rem",
    color: "#e6edf3",
    margin: "0 0 8px",
  },
  emptyText: { margin: "0 0 24px", fontSize: "0.9rem" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "12px",
    padding: "20px",
    cursor: "pointer",
    transition: "border-color 0.15s",
    position: "relative",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  langIcon: { fontSize: "1.5rem" },
  cardBadges: { display: "flex", gap: "6px" },
  langBadge: {
    background: "#21262d",
    border: "1px solid #30363d",
    color: "#8b949e",
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "0.75rem",
  },
  privateBadge: {
    background: "#2d1b1b",
    border: "1px solid #f85149",
    color: "#f85149",
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "0.75rem",
  },
  cardTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#e6edf3",
    margin: "0 0 6px",
    paddingRight: "28px", // space for delete button
  },
  cardMeta: {
    fontSize: "0.8rem",
    color: "#484f58",
    margin: "0 0 12px",
  },
  roomId: {
    fontSize: "0.78rem",
    color: "#58a6ff",
    fontFamily: "monospace",
    background: "#0d1117",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
    cursor: "copy",
  },
  deleteBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
    opacity: 0.5,
    padding: "4px",
  },
};

export default Dashboard;
