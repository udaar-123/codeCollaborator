import { useEffect, useRef, useCallback, useState } from "react";

export const useCursors = ({ socket, roomId, user, editorRef, myColor }) => {
  // Map of userId → { decoration, name, color }
  const decorationsRef = useRef(new Map());
  const lastEmitRef = useRef(0);

  // Track remote cursors for display in participant list
  const [remoteCursors, setRemoteCursors] = useState({});

  useEffect(() => {
    if (!socket) return;

    // Receive cursor from another user
    const onCursorUpdate = ({ userId, name, color, position }) => {
      const editor = editorRef.current;
      if (!editor) return;

      // Update remote cursors state for UI display
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { name, color, position },
      }));

      // Apply Monaco decoration
      applyRemoteCursor(editor, userId, name, color, position, decorationsRef);
    };

    // Remove cursor when user leaves
    const onCursorRemove = ({ userId }) => {
      const editor = editorRef.current;
      if (editor) {
        removeRemoteCursor(editor, userId, decorationsRef);
      }
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    socket.on("cursor-update", onCursorUpdate);
    socket.on("cursor-remove", onCursorRemove);

    return () => {
      socket.off("cursor-update", onCursorUpdate);
      socket.off("cursor-remove", onCursorRemove);
    };
  }, [socket, editorRef]);

  // Called when local user moves cursor
  // Throttled to 20 updates per second (every 50ms)
  const handleCursorChange = useCallback(
    (position) => {
      const now = Date.now();
      if (now - lastEmitRef.current < 50) return; // throttle
      lastEmitRef.current = now;

      socket.emit("cursor-move", {
        roomId,
        position: {
          lineNumber: position.lineNumber,
          column: position.column,
        },
        name: user?.name || "User",
        color: myColor || "#58a6ff",
      });
    },
    [socket, roomId, user, myColor],
  );

  // Cleanup all decorations when leaving room
  const clearAllCursors = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    for (const [userId] of decorationsRef.current) {
      removeRemoteCursor(editor, userId, decorationsRef);
    }
    decorationsRef.current.clear();
    setRemoteCursors({});
  }, [editorRef]);

  return { handleCursorChange, remoteCursors, clearAllCursors };
};

// ─── HELPERS ─────────────────────────────────────────────

const applyRemoteCursor = (
  editor,
  userId,
  name,
  color,
  position,
  decorationsRef,
) => {
  const model = editor.getModel();
  if (!model) return;

  // Remove existing decoration for this user first
  removeRemoteCursor(editor, userId, decorationsRef);

  const { lineNumber, column } = position;

  // Inject CSS for this user's cursor color
  // Each user gets a unique class based on their userId
  const safeId = userId.replace(/[^a-zA-Z0-9]/g, "");
  injectCursorStyle(safeId, color, name);

  // Apply Monaco decoration
  const newDecorations = editor.deltaDecorations(
    [],
    [
      {
        // The cursor line (thin colored line)
        range: {
          startLineNumber: lineNumber,
          startColumn: column,
          endLineNumber: lineNumber,
          endColumn: column,
        },
        options: {
          className: `remote-cursor-${safeId}`,
          // Label shown above cursor
          before: {
            content: name,
            inlineClassName: `remote-cursor-label-${safeId}`,
          },
          stickiness: 1, // cursor sticks to character
        },
      },
    ],
  );

  // Store decoration IDs so we can remove later
  decorationsRef.current.set(userId, newDecorations);
};

const removeRemoteCursor = (editor, userId, decorationsRef) => {
  const existing = decorationsRef.current.get(userId);
  if (existing) {
    editor.deltaDecorations(existing, []);
    decorationsRef.current.delete(userId);
  }
};

// Inject cursor CSS into document head
// Each user gets their own style tag
const injectedStyles = new Set();

const injectCursorStyle = (safeId, color, name) => {
  // Don't inject twice for same user
  if (injectedStyles.has(safeId)) return;
  injectedStyles.add(safeId);

  const style = document.createElement("style");
  style.setAttribute("data-cursor-id", safeId);
  style.textContent = `
    .remote-cursor-${safeId} {
      border-left: 2px solid ${color};
      margin-left: -1px;
    }

    .remote-cursor-label-${safeId} {
      background: ${color};
      color: #000;
      font-size: 10px;
      font-weight: 600;
      padding: 1px 4px;
      border-radius: 3px 3px 3px 0;
      position: absolute;
      top: -18px;
      white-space: nowrap;
      pointer-events: none;
      font-family: -apple-system, sans-serif;
      z-index: 100;
      opacity: 0.9;
    }
  `;
  document.head.appendChild(style);
};
