import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

export default function EditorPanel({
  code,
  onChange,
  onAnalyze,
  issues = [],
  highlightLine,
  isDark
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Keyboard shortcut: Ctrl+Enter (or Cmd+Enter on Mac) to run analysis
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onAnalyze) {
        onAnalyze();
      }
    });

    updateMarkers();
  };

  // Synchronize error and warning squiggles in Monaco Editor
  const updateMarkers = () => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers = issues.map((iss) => {
      let severity = monaco.MarkerSeverity.Warning;
      if (iss.severity === 'error') {
        severity = monaco.MarkerSeverity.Error;
      } else if (iss.severity === 'info') {
        severity = monaco.MarkerSeverity.Info;
      }

      const startLineNumber = Math.max(1, iss.line);
      const startColumn = Math.max(1, iss.col);
      const lineContent = model.getLineContent(startLineNumber) || '';
      const endColumn = Math.max(startColumn + 1, lineContent.length + 1);

      return {
        severity,
        message: `${iss.type}: ${iss.message}${iss.suggestion ? `\n💡 Suggestion: ${iss.suggestion}` : ''}`,
        startLineNumber,
        startColumn,
        endLineNumber: startLineNumber,
        endColumn
      };
    });

    monaco.editor.setModelMarkers(model, 'static-code-analyzer', markers);
  };

  useEffect(() => {
    updateMarkers();
  }, [issues]);

  // Jump to specific line when user clicks an issue in the right panel
  useEffect(() => {
    if (highlightLine && editorRef.current) {
      editorRef.current.revealLineInCenter(highlightLine);
      editorRef.current.setPosition({ lineNumber: highlightLine, column: 1 });
      editorRef.current.focus();
    }
  }, [highlightLine]);

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-dark-600 overflow-hidden">
      {/* Editor Header */}
      <div className="bg-dark-800 border-b border-dark-600 px-4 py-2 flex items-center justify-between text-xs text-dark-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-green/80 inline-block"></span>
          <span className="font-semibold text-dark-200">main.cpp</span>
          <span className="text-[11px] text-dark-400">• ISO C++17</span>
        </div>
        <div className="text-[11px] text-dark-400 hidden sm:block">
          Press <kbd className="bg-dark-700 px-1.5 py-0.5 rounded text-dark-200">Ctrl+Enter</kbd> to analyze
        </div>
      </div>

      {/* Monaco Container */}
      <div className="flex-1 min-h-[400px]">
        <Editor
          height="100%"
          language="cpp"
          theme={isDark ? "vs-dark" : "light"}
          value={code}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontSize: 13,
            lineHeight: 22,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            renderWhitespace: "selection",
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            glyphMargin: true,
            folding: true,
            renderLineHighlight: "all",
            smoothScrolling: true,
            bracketPairColorization: { enabled: true }
          }}
        />
      </div>

      {/* Editor Footer Status Bar */}
      <div className="bg-dark-850 border-t border-dark-600 px-4 py-1.5 flex items-center justify-between text-[11px] text-dark-400 font-mono">
        <div>
          <span>C++ (C++17)</span>
          <span className="mx-2">•</span>
          <span>UTF-8</span>
        </div>
        <div>
          <span>{code.split('\n').length} Lines</span>
          <span className="mx-2">•</span>
          <span>{code.length} Characters</span>
        </div>
      </div>
    </div>
  );
}
