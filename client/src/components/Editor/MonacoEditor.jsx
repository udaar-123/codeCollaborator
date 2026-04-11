import Editor from "@monaco-editor/react"
import { useRef } from "react"

const MonacoEditor = ({
  content,
  language,
  onChange,
  onMount,
  readOnly = false
}) => {
  const editorRef = useRef(null)
  const handleMount = (editor, monaco) => {
    editorRef.current = editor
    monaco.editor.defineTheme("codeeditor-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment",  foreground: "6e7681", fontStyle: "italic" },
        { token: "keyword",  foreground: "ff7b72" },
        { token: "string",   foreground: "a5d6ff" },
        { token: "number",   foreground: "79c0ff" },
        { token: "function", foreground: "d2a8ff" },
      ],
      colors: {
        "editor.background":           "#0d1117",
        "editor.foreground":           "#e6edf3",
        "editor.lineHighlightBackground": "#161b22",
        "editorLineNumber.foreground": "#484f58",
        "editorLineNumber.activeForeground": "#e6edf3",
        "editor.selectionBackground":  "#264f78",
        "editorCursor.foreground":     "#58a6ff",
        "editorIndentGuide.background1": "#21262d",
      }
    })
    monaco.editor.setTheme("codeeditor-dark")
    if (onMount) onMount(editor, monaco)
  }
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={content}
        onMount={handleMount}
        onChange={onChange}
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          lineHeight: 22,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          insertSpaces: true,
          readOnly,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: "line",
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: "off",
          wordBasedSuggestions: "currentDocument",
          parameterHints: { enabled: false }
        }}
      />
    </div>
  )
}
export default MonacoEditor
