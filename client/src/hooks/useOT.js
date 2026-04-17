import { useRef, useCallback, useEffect } from "react";
import { monacoChangeToOp, applyOp } from "../utils/ot.js";

export const useOT = ({
  socket,
  roomId,
  editorRef,
  setCode,
  userId,
  onOperation,
}) => {
  const versionRef = useRef(0);
  const pendingOps = useRef(new Map()); // Track ops by ID instead of array
  const opIdRef = useRef(0); // Auto-increment op ID
  const isApplyingRef = useRef(false);

  useEffect(() => {
    if (!socket) return;
    const onRoomState = ({ content, version }) => {
      versionRef.current = version;
      isApplyingRef.current = true;
      if (content && content.trim() !== "") {
        setCode(content);
      }

      setTimeout(() => {
        isApplyingRef.current = false;
      }, 100);
    };

    const onOperation = ({ op, version, userId: senderId, batchId }) => {
      versionRef.current = version;

      if (senderId === userId?.toString()) {
        pendingOps.current.delete(batchId);
        return;
      }

      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      isApplyingRef.current = true;

      try {
        const range = getMonacoRange(editor, op);

        if (!range) {
          isApplyingRef.current = false;
          return;
        }

        const model = editor.getModel();
        editor.executeEdits("remote-op", [
          {
            range,
            text: op.type === "insert" ? op.text : "",
            forceMoveMarkers: true,
          },
        ]);

        const afterContent = model.getValue();
        setCode(afterContent);
      } catch (err) {
        // Silently handle error
      } finally {
        isApplyingRef.current = false;
      }
    };

    const onRoomReset = ({ content, version, language }) => {
      // Clear all pending operations to avoid stale ops being applied
      pendingOps.current.clear();

      versionRef.current = version;
      isApplyingRef.current = true;
      setCode(content);

      setTimeout(() => {
        isApplyingRef.current = false;
      }, 100);
    };

    socket.on("room-state", onRoomState);
    socket.on("operation", onOperation);
    socket.on("room-reset", onRoomReset);

    return () => {
      socket.off("room-state", onRoomState);
      socket.off("operation", onOperation);
      socket.off("room-reset", onRoomReset);
    };
  }, [socket, editorRef, setCode, userId]);

  const handleChange = useCallback(
    (value, event) => {
      setCode(value);

      if (isApplyingRef.current) {
        return;
      }

      if (!event?.changes || event.changes.length === 0) {
        return;
      }

      for (const change of event.changes) {
        const ops = monacoChangeToOp(change);

        if (!ops) {
          continue;
        }
        const opList = Array.isArray(ops) ? ops : [ops];

        // Assign same batch ID to all ops from this change event
        const batchId = opIdRef.current++;

        for (const op of opList) {
          socket.emit("operation", {
            roomId,
            op,
            batchId,
            version: versionRef.current,
          });

          pendingOps.current.set(batchId, op);
          if (onOperation) {
            onOperation("operation", op);
          }
        }
      }
    },
    [socket, roomId, setCode, onOperation],
  );

  return { handleChange };
};

const getMonacoRange = (editor, op) => {
  const model = editor.getModel();
  if (!model) return null;

  if (op.type === "insert") {
    const pos = model.getPositionAt(op.position);
    return {
      startLineNumber: pos.lineNumber,
      startColumn: pos.column,
      endLineNumber: pos.lineNumber,
      endColumn: pos.column,
    };
  }

  if (op.type === "delete") {
    const startPos = model.getPositionAt(op.position);
    const endPos = model.getPositionAt(op.position + op.length);
    return {
      startLineNumber: startPos.lineNumber,
      startColumn: startPos.column,
      endLineNumber: endPos.lineNumber,
      endColumn: endPos.column,
    };
  }

  return null;
};
