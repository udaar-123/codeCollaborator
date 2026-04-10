import Editor from "@monaco-editor/react";

const MonacoEditor = ({language,content,onChange})=>{
  return(
    <Editor
     height="90vh"
      language={language}
      value={content}
      onChange={onChange}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
      }}
      />
  )
}