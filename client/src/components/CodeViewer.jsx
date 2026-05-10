import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodeViewer = ({ filePath, content, issues }) => {
  const language = filePath?.split('.').pop() || 'javascript';
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) {
      return;
    }

    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) {
      return;
    }

    const markers = (issues || []).map((issue) => ({
      startLineNumber: issue.line || 1,
      endLineNumber: issue.endLine || issue.line || 1,
      startColumn: issue.column || 1,
      endColumn: issue.endColumn || issue.column || 120,
      message: `${issue.errorType || issue.source || 'Issue'}: ${issue.issue}\nSolution: ${issue.fixSuggestion}`,
      severity:
        issue.severity === 'Critical' || issue.severity === 'High'
          ? monaco.MarkerSeverity.Error
          : monaco.MarkerSeverity.Warning
    }));

    monaco.editor.setModelMarkers(model, 'issues', markers);
  }, [issues, content, filePath]);

  return (
    <div className="glass-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-sm text-soft">{filePath || 'Select a file'}</p>
        <p className="text-xs uppercase tracking-[0.25em] text-soft/60">{issues?.length || 0} annotations</p>
      </div>
      <Editor
        height="32rem"
        theme="vs-dark"
        language={language}
        value={content}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          readOnly: true,
          scrollBeyondLastLine: false
        }}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;
        }}
      />
    </div>
  );
};

export default CodeViewer;
