import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import { useRoom } from "../hooks/useRoom.js"
import { useOT } from "../hooks/useOT.js"           
import MonacoEditor from "../components/Editor/MonacoEditor.jsx"
import EditorToolbar from "../components/Editor/EditorToolbar.jsx"
import OutputPanel from "../components/Editor/OutputPanel.jsx"
import RoomHeader from "../components/Room/RoomHeader.jsx"
import Toast from "../components/shared/Toast.jsx"
import { DEFAULT_CODE } from "../utils/languageConfig.js"

const EditorRoom = () => {
  const { roomId } = useParams()
  const { user, socket } = useAuth()
  const { getRoom } = useRoom()
  const navigate = useNavigate()

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [output, setOutput] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [toast, setToast] = useState(null)

  const editorRef = useRef(null)

 
  const { handleChange } = useOT({
    socket,
    roomId,
    editorRef,
    setCode,
     userId: user?._id,
  })

 
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRoom(roomId)
        setRoom(data)
        setLanguage(data.language)
        const initialCode = (data.content && data.content.trim() !== "") 
          ? data.content 
          : DEFAULT_CODE[data.language]
        setCode(initialCode)

        socket.emit("join-room", { roomId })
      } catch (err) {
        setToast({ message: err.message, type: "error" })
        setTimeout(() => navigate("/dashboard"), 2000)
      } finally {
        setLoading(false)
      }
    }
    load()

    return () => {
      socket.emit("leave-room", { roomId })
    }
  }, [roomId])

  useEffect(() => {
    if (!socket) return

    const onLanguageChanged = ({ language: newLang }) => {
      setLanguage(newLang)
      setCode(DEFAULT_CODE[newLang])
      setToast({ message: `Language changed to ${newLang}`, type: "info" })
    }

    const onUserJoined = ({ name }) => {
      setToast({ message: `${name} joined`, type: "info" })

      getRoom(roomId).then(setRoom).catch(() => {})
    }

    const onUserLeft = () => {
      getRoom(roomId).then(setRoom).catch(() => {})
    }

    const onOutputChunk = ({ data }) => {
      setOutput(prev => [...prev, { text: data, type: "output" }])
    }

    const onOutputEnd = () => {
      setIsRunning(false)
      setOutput(prev => [...prev, {
        text: "── execution complete ──",
        type: "system"
      }])
    }

    socket.on("language-changed", onLanguageChanged)
    socket.on("user-joined", onUserJoined)
    socket.on("user-left", onUserLeft)
    socket.on("output-chunk", onOutputChunk)
    socket.on("output-end", onOutputEnd)

    return () => {
      socket.off("language-changed", onLanguageChanged)
      socket.off("user-joined", onUserJoined)
      socket.off("user-left", onUserLeft)
      socket.off("output-chunk", onOutputChunk)
      socket.off("output-end", onOutputEnd)
    }
  }, [socket, roomId])

  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang)
    setCode(DEFAULT_CODE[newLang])
    socket.emit("language-change", { roomId, language: newLang })
  }, [socket, roomId])

  const handleRun = useCallback(() => {
    setIsRunning(true)
    setOutput([{ text: `Running ${language}...`, type: "system" }])
    socket.emit("run-code", { code, language, roomId })

    // Temporary until Phase 6
    setTimeout(() => {
      setOutput(prev => [
        ...prev,
        { text: "Docker execution coming in Phase 6", type: "system" }
      ])
      setIsRunning(false)
    }, 1000)
  }, [code, language, roomId, socket])

  const isOwner = room?.owner?._id === user?._id ||
                  room?.owner === user?._id

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading room...</p>
      </div>
    )
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

      <RoomHeader
        room={room}
        onCopyId={() => {
          navigator.clipboard.writeText(roomId)
          setToast({ message: "Room ID copied!", type: "success" })
        }}
      />

      <EditorToolbar
        language={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        isRunning={isRunning}
        roomName={room?.name}
        participants={room?.participants}
        isOwner={isOwner}
      />

      <div style={styles.main}>
        <div style={styles.editorPane}>
          <MonacoEditor
            content={code}
            language={language}
            onChange={handleChange}       // ← OT handler not setCode
            onMount={(editor) => {
              editorRef.current = editor  // ← give OT hook access to editor
            }}
          />
        </div>

        <div style={styles.outputPane}>
          <OutputPanel
            output={output}
            isRunning={isRunning}
            onClear={() => setOutput([])}
          />
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    height: "100vh",
    background: "#0d1117",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  loading: {
    height: "100vh",
    background: "#0d1117",
    color: "#8b949e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
  },
  editorPane: {
    flex: "0 0 65%",
    minHeight: 0,
    overflow: "hidden",
  },
  outputPane: {
    flex: "0 0 35%",
    minHeight: 0,
    overflow: "hidden",
  },
}

export default EditorRoom