import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertCircle, 
  Layers, 
  Binary, 
  Network, 
  BarChart3, 
  CheckCircle2,
  Terminal,
  RefreshCw,
  Sliders,
  Sparkles,
  Cpu
} from 'lucide-react';

import TopBar from './components/TopBar';
import EditorPanel from './components/EditorPanel';
import IssuesTab from './components/tabs/IssuesTab';
import TokensTab from './components/tabs/TokensTab';
import SymbolTableTab from './components/tabs/SymbolTableTab';
import ASTVisualizer from './components/tabs/ASTVisualizer';
import MetricsTab from './components/tabs/MetricsTab';
import DFASimulatorTab from './components/tabs/DFASimulatorTab';
import HistoryModal from './components/HistoryModal';
import { exportAnalysisPDF } from './utils/exportPdf';

const API_BASE = 'http://127.0.0.1:8000';

const DEFAULT_SAMPLE_CODE = `// ============================================================================
// Clean Code: Idiomatic C++ adhering to static analysis standards
// ============================================================================

int square(int val) {
    return val * val;
}

int absoluteValue(int num) {
    if (num < 0) {
        return -num;
    }
    return num;
}

int computeFactorial(int n) {
    int result = 1;
    for (int i = 1; i <= n; i++) {
        result *= i;
    }
    return result;
}

int clamp(int value, int minVal, int maxVal) {
    if (value < minVal) {
        return minVal;
    }
    if (value > maxVal) {
        return maxVal;
    }
    return value;
}

int main() {
    int inputVal = 5;
    int squared = square(inputVal);
    int fact = computeFactorial(inputVal);
    int clamped = clamp(squared, 0, 100);

    int finalResult = clamped + fact;
    return finalResult;
}`;

export default function App() {
  const [code, setCode] = useState(DEFAULT_SAMPLE_CODE);
  const [analysis, setAnalysis] = useState(null);
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState('');
  const [activeTab, setActiveTab] = useState('metrics'); // 'issues', 'tokens', 'symbols', 'ast', 'metrics'
  const [highlightLine, setHighlightLine] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [isDark, setIsDark] = useState(true);
  const [splitRatio, setSplitRatio] = useState(50); // Left panel width in percent (20-80)
  const [isDragging, setIsDragging] = useState(false);
  const workspaceRef = useRef(null);

  // Load theme, history & splitRatio from localStorage on startup
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('codeaccuracy_theme');
      if (savedTheme !== null) {
        const dark = savedTheme === 'dark';
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
      } else {
        document.documentElement.classList.add('dark');
      }

      const savedHistory = localStorage.getItem('codeaccuracy_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }

      const savedSplit = localStorage.getItem('codeaccuracy_split_ratio');
      if (savedSplit) {
        const parsed = parseFloat(savedSplit);
        if (!isNaN(parsed) && parsed >= 20 && parsed <= 80) {
          setSplitRatio(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
    }
  }, []);

  // Handle dragging the wall between code editor and diagnostics/AST
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const totalWidth = rect.width;
      let newRatio = (relativeX / totalWidth) * 100;
      // Clamp between 20% and 80% to prevent collapsing panels
      if (newRatio < 20) newRatio = 20;
      if (newRatio > 80) newRatio = 80;
      setSplitRatio(Math.round(newRatio * 10) / 10);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      try {
        localStorage.setItem('codeaccuracy_split_ratio', String(splitRatio));
      } catch (e) {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, splitRatio]);

  const handleStartDrag = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Fetch samples from backend on mount
  useEffect(() => {
    async function loadSamples() {
      try {
        const res = await fetch(`${API_BASE}/samples`);
        if (res.ok) {
          const data = await res.json();
          setSamples(data.samples || []);
          if (data.samples && data.samples.length > 0) {
            setSelectedSample(data.samples[0].id);
          }
        }
      } catch (err) {
        console.warn('Backend /samples endpoint not reached, using defaults.');
      }
    }
    loadSamples();
    // Run initial analysis
    runAnalysis(DEFAULT_SAMPLE_CODE);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('codeaccuracy_theme', next ? 'dark' : 'light');
    } catch (e) {}
  };

  const runAnalysis = async (codeToAnalyze = code) => {
    if (!codeToAnalyze.trim()) {
      setErrorMsg('Code editor is empty. Please enter C/C++ code.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToAnalyze, language: 'cpp' })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Analysis request failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      setAnalysis(data);

      // Save to localStorage history (max 10 runs)
      try {
        const newEntry = {
          timestamp: new Date().toISOString(),
          code: codeToAnalyze,
          analysis: data
        };
        const updatedHistory = [newEntry, ...history.slice(0, 9)];
        setHistory(updatedHistory);
        localStorage.setItem('codeaccuracy_history', JSON.stringify(updatedHistory));
      } catch (e) {
        console.warn('Failed to update localStorage history:', e);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setErrorMsg(err.message || 'Unable to connect to analysis server. Make sure FastAPI backend is running on port 8000.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectSample = (sampleId) => {
    setSelectedSample(sampleId);
    const found = samples.find((s) => s.id === sampleId);
    if (found) {
      setCode(found.code);
      runAnalysis(found.code);
    }
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setCode(content);
      setSelectedSample('');
      runAnalysis(content);
    };
    reader.readAsText(file);
  };

  const handleExportPDF = () => {
    if (analysis) {
      exportAnalysisPDF(analysis, 'static_code_analysis_report.pdf');
    }
  };

  const handleSelectHistoryItem = (item) => {
    setCode(item.code);
    setAnalysis(item.analysis);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('codeaccuracy_history');
    } catch (e) {}
  };

  const handleJumpToLine = (lineNumber) => {
    setHighlightLine(lineNumber);
    // Reset after trigger so subsequent clicks to same line still fire
    setTimeout(() => setHighlightLine(null), 300);
  };

  const totalIssues = analysis?.issues?.length || 0;
  const errorCount = analysis?.issues?.filter((i) => i.severity === 'error').length || 0;
  const warningCount = analysis?.issues?.filter((i) => i.severity === 'warning').length || 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-dark-900 font-sans">
      {/* Top Application Bar */}
      <TopBar
        samples={samples}
        selectedSample={selectedSample}
        onSelectSample={handleSelectSample}
        onFileUpload={handleFileUpload}
        onAnalyze={() => runAnalysis(code)}
        isAnalyzing={isAnalyzing}
        onExportPDF={handleExportPDF}
        hasAnalysis={!!analysis}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Error Notification Banner if any */}
      {errorMsg && (
        <div className="bg-red-500/15 border-b border-red-500/30 px-4 py-2 flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-200 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Two-Panel Workspace with Draggable Wall */}
      <div 
        ref={workspaceRef}
        className={`flex-1 flex flex-col lg:flex-row overflow-hidden relative ${isDragging ? 'select-none' : ''}`}
      >
        {/* Fullscreen transparent shield while dragging to avoid Monaco/SVG stealing mouse events */}
        {isDragging && (
          <div className="fixed inset-0 z-50 cursor-col-resize select-none bg-transparent" />
        )}

        {/* Left Panel: Monaco Code Editor */}
        <div 
          style={{ flexBasis: `${splitRatio}%`, maxWidth: `${splitRatio}%` }}
          className="w-full lg:w-auto h-1/2 lg:h-full flex-shrink-0 flex-grow-0 overflow-hidden"
        >
          <EditorPanel
            code={code}
            onChange={setCode}
            onAnalyze={() => runAnalysis(code)}
            issues={analysis?.issues || []}
            highlightLine={highlightLine}
            isDark={isDark}
          />
        </div>

        {/* Draggable Divider (The Wall) */}
        <div
          onMouseDown={handleStartDrag}
          onDoubleClick={() => setSplitRatio(50)}
          className="hidden lg:flex w-2 hover:w-2.5 active:w-2.5 bg-dark-800 hover:bg-brand-blue/40 active:bg-brand-blue/80 transition-all cursor-col-resize items-center justify-center border-x border-dark-600/80 group z-20 shrink-0 select-none shadow-sm"
          title="Drag to resize Code and AST panels (Double-click to reset 50/50)"
        >
          <div className="w-1 h-8 rounded-full bg-dark-500 group-hover:bg-brand-blue group-active:bg-white transition-colors flex flex-col items-center justify-center gap-0.5">
            <span className="w-0.5 h-0.5 rounded-full bg-dark-300"></span>
            <span className="w-0.5 h-0.5 rounded-full bg-dark-300"></span>
            <span className="w-0.5 h-0.5 rounded-full bg-dark-300"></span>
          </div>
        </div>

        {/* Right Panel: Diagnostics & Tabs Suite (50% Width) */}
        <div 
          style={{ flexBasis: `${100 - splitRatio}%`, maxWidth: `${100 - splitRatio}%` }}
          className="w-full lg:w-auto h-1/2 lg:h-full flex flex-col bg-dark-850 overflow-hidden flex-1"
        >
          {/* Navigation Tab Bar */}
          <div className="bg-dark-800 border-b border-dark-600 flex items-center overflow-x-auto select-none scrollbar-none">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                activeTab === 'metrics'
                  ? 'border-brand-blue text-brand-blue bg-dark-750'
                  : 'border-transparent text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Metrics & Quality</span>
              {analysis?.metrics?.quality_score !== undefined && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-dark-900 border border-dark-600 text-brand-green">
                  {analysis.metrics.quality_score.toFixed(0)}%
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                activeTab === 'issues'
                  ? 'border-brand-blue text-brand-blue bg-dark-750'
                  : 'border-transparent text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Issues</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                errorCount > 0 
                  ? 'bg-red-500/20 text-red-400' 
                  : warningCount > 0 
                  ? 'bg-amber-500/20 text-amber-400' 
                  : 'bg-dark-700 text-dark-400'
              }`}>
                {totalIssues}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                activeTab === 'tokens'
                  ? 'border-brand-blue text-brand-blue bg-dark-750'
                  : 'border-transparent text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>Tokens</span>
              <span className="text-[10px] text-dark-500 font-mono">
                ({analysis?.tokens?.length || 0})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('symbols')}
              className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                activeTab === 'symbols'
                  ? 'border-brand-blue text-brand-blue bg-dark-750'
                  : 'border-transparent text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Symbol Table</span>
              <span className="text-[10px] text-dark-500 font-mono">
                ({analysis?.symbol_table?.length || 0})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ast')}
              className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                activeTab === 'ast'
                  ? 'border-brand-blue text-brand-blue bg-dark-750'
                  : 'border-transparent text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>AST Tree</span>
            </button>

            <button
              onClick={() => setActiveTab('dfa')}
              className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                activeTab === 'dfa'
                  ? 'border-brand-blue text-brand-blue bg-dark-750'
                  : 'border-transparent text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-brand-purple" />
              <span>DFA Animator</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                Live
              </span>
            </button>
          </div>

          {/* Active Tab Body */}
          <div className="flex-1 overflow-hidden relative">
            {isAnalyzing && (
              <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-7 h-7 text-brand-blue animate-spin" />
                <span className="text-xs font-semibold text-dark-200">Running Static Passes...</span>
              </div>
            )}

            {activeTab === 'metrics' && (
              <MetricsTab
                metrics={analysis?.metrics || {}}
                issues={analysis?.issues || []}
              />
            )}

            {activeTab === 'issues' && (
              <IssuesTab
                issues={analysis?.issues || []}
                onSelectLine={handleJumpToLine}
              />
            )}

            {activeTab === 'tokens' && (
              <TokensTab tokens={analysis?.tokens || []} />
            )}

            {activeTab === 'symbols' && (
              <SymbolTableTab symbols={analysis?.symbol_table || []} />
            )}

            {activeTab === 'ast' && (
              <ASTVisualizer ast={analysis?.ast} />
            )}

            {activeTab === 'dfa' && (
              <DFASimulatorTab
                trace={analysis?.dfa_trace || []}
                sourceCode={code}
              />
            )}
          </div>
        </div>
      </div>

      {/* Analysis History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistory={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
