import React, { useEffect, useRef, useState } from 'react';
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
  const [monacoMounted, setMonacoMounted] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const textareaRef = useRef(null);

  // Auto fallback if Monaco takes more than 4 seconds to load from CDN
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!monacoMounted) {
        setUseFallback(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [monacoMounted]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setMonacoMounted(true);
    setUseFallback(false);

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
    if (highlightLine) {
      if (editorRef.current && !useFallback) {
        editorRef.current.revealLineInCenter(highlightLine);
        editorRef.current.setPosition({ lineNumber: highlightLine, column: 1 });
        editorRef.current.focus();
      } else if (textareaRef.current) {
        const lines = code.split('\n');
        let charIndex = 0;
        for (let i = 0; i < Math.min(highlightLine - 1, lines.length); i++) {
          charIndex += lines[i].length + 1;
        }
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(charIndex, charIndex);
      }
    }
  }, [highlightLine, useFallback]);

  const handleKeyDownFallback = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onAnalyze) onAnalyze();
    }
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1).join('\n');

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-dark-600 overflow-hidden">
      {/* Editor Header */}
      <div className="bg-dark-800 border-b border-dark-600 px-4 py-2 flex items-center justify-between text-xs text-dark-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-green/80 inline-block"></span>
          <span className="font-semibold text-dark-200">main.cpp</span>
          <span className="text-[11px] text-dark-400">• ISO C++17</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseFallback(!useFallback)}
            className="text-[10px] px-2 py-0.5 rounded bg-dark-700 hover:bg-dark-650 text-dark-300 border border-dark-600 transition"
            title="Switch between Monaco Rich Editor and Lightweight Editor"
          >
            {useFallback ? '⚡ Switch to Monaco' : '📝 Simple Mode'}
          </button>
          <div className="text-[11px] text-dark-400 hidden sm:block">
            Press <kbd className="bg-dark-700 px-1.5 py-0.5 rounded text-dark-200">Ctrl+Enter</kbd> to analyze
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 min-h-[400px] relative overflow-hidden">
        {useFallback ? (
          /* Offline / Lightweight Fallback Editor */
          <div className="flex h-full font-mono text-xs bg-dark-900 text-dark-100">
            {/* Line Number Gutter */}
            <div className="bg-dark-850 text-dark-500 py-3 px-3 select-none text-right font-mono border-r border-dark-700 leading-6 whitespace-pre">
              {lineNumbers}
            </div>
            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDownFallback}
              spellCheck="false"
              className="flex-1 p-3 bg-transparent text-dark-100 resize-none focus:outline-none font-mono leading-6 selection:bg-brand-blue/30 overflow-auto"
              placeholder="// Write or paste C/C++ code here..."
            />
          </div>
        ) : (
          /* Monaco Editor */
          <Editor
            height="100%"
            language="cpp"
            theme={isDark ? "vs-dark" : "light"}
            value={code}
            loading={
              <div className="flex flex-col items-center justify-center h-full text-dark-400 gap-2">
                <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Connecting Monaco Studio...</span>
                <button
                  onClick={() => setUseFallback(true)}
                  className="mt-2 text-xs text-brand-blue hover:underline"
                >
                  Click here for Lightweight Editor
                </button>
              </div>
            }
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
        )}
      </div>

      {/* Editor Footer Status Bar */}
      <div className="bg-dark-850 border-t border-dark-600 px-4 py-1.5 flex items-center justify-between text-[11px] text-dark-400 font-mono">
        <div>
          <span>C++ (C++17)</span>
          <span className="mx-2">•</span>
          <span>{useFallback ? 'Lightweight Engine' : 'Monaco Language Engine'}</span>
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
