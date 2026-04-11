import { useRef, useCallback, useEffect } from "react"
import { monacoChangeToOp, applyOp } from "../utils/ot.js"

export const useOT = ({ socket, roomId, editorRef, setCode, userId }) => {
  const versionRef = useRef(0)
  const pendingOps = useRef([])
  const isApplyingRef = useRef(false)

  useEffect(() => {
    if (!socket) return
    const onRoomState = ({ content, version }) => {
      versionRef.current = version
      isApplyingRef.current = true  
      if(content && content.trim() !== ""){
      setCode(content)
      }
    
      setTimeout(() => {
        isApplyingRef.current = false
      }, 100)
    }

    const onOperation = ({ op, version, userId: senderId }) => {
     
      versionRef.current = version

    
      if (senderId === userId?.toString()) {
       
        pendingOps.current.shift()
        return
      }

      const editor = editorRef.current
      if (!editor) {
        
        return
      }

    
      isApplyingRef.current = true

      try {
        const range = getMonacoRange(editor, op)

        if (!range) {
        
          isApplyingRef.current = false
          return
        }

      
        editor.executeEdits("remote-op", [{
          range,
          text: op.type === "insert" ? op.text : "",
          forceMoveMarkers: true,
        }])
      } catch (err) {
        console.log(" Error applying remote op:", err.message)
      } finally {
      
        isApplyingRef.current = false
      }
    }

    socket.on("room-state", onRoomState)
    socket.on("operation", onOperation)

    return () => {
      socket.off("room-state", onRoomState)
      socket.off("operation", onOperation)
    }
  }, [socket, editorRef, setCode, userId])

  
  const handleChange = useCallback((value, event) => {

  
    if (isApplyingRef.current) {
      return
    }

    if (!event?.changes || event.changes.length === 0) {
      return
    }

   

    for (const change of event.changes) {
      // Convert Monaco change to our op format
      const ops = monacoChangeToOp(change)

      if (!ops) {
        continue
      }

      // monacoChangeToOp can return single op or array (for replace)
      const opList = Array.isArray(ops) ? ops : [ops]

      for (const op of opList) {

        socket.emit("operation", {
          roomId,
          op,
          version: versionRef.current,
        })

        // Track pending ops
        pendingOps.current.push(op)
      }
    }
  }, [socket, roomId])

  return { handleChange }
}

const getMonacoRange = (editor, op) => {
  const model = editor.getModel()
  if (!model) return null

  if (op.type === "insert") {
    const pos = model.getPositionAt(op.position)
    return {
      startLineNumber: pos.lineNumber,
      startColumn: pos.column,
      endLineNumber: pos.lineNumber,
      endColumn: pos.column,
    }
  }

  if (op.type === "delete") {
   
    const startPos = model.getPositionAt(op.position)
    const endPos   = model.getPositionAt(op.position + op.length)
    return {
      startLineNumber: startPos.lineNumber,
      startColumn:     startPos.column,
      endLineNumber:   endPos.lineNumber,
      endColumn:       endPos.column,
    }
  }

  return null
}