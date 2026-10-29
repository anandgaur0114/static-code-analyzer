import React, { useRef } from 'react';
import { 
  Play, 
  Upload, 
  Download, 
  History, 
  Sun, 
  Moon, 
  FileCode2, 
  Sparkles,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export default function TopBar({
  samples,
  selectedSample,
  onSelectSample,
  onFileUpload,
  onAnalyze,
  isAnalyzing,
  onExportPDF,
  hasAnalysis,
  onOpenHistory,
  historyCount,
  isDark,
  onToggleTheme
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  return (
    <header className="bg-dark-850 border-b border-dark-600 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap select-none sticky top-0 z-30 shadow-md">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue via-brand-purple to-brand-green flex items-center justify-center shadow-lg shadow-brand-blue/20">
          <FileCode2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-dark-100 tracking-tight flex items-center gap-1.5">
              CodeAccuracy
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                Compiler Studio
              </span>
            </h1>
          </div>
          <p className="text-xs text-dark-400 hidden sm:block">
            LL(1) Parser • Scoped Symbol Table • McCabe V(G) • Security Analyzer
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sample Programs Dropdown */}
        <div className="relative">
          <select
            value={selectedSample}
            onChange={(e) => onSelectSample(e.target.value)}
            className="bg-dark-800 hover:bg-dark-750 text-dark-200 border border-dark-600 hover:border-dark-500 rounded-md px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue transition cursor-pointer pr-7 max-w-[200px] truncate"
            title="Load Pre-configured Sample Code"
          >
            <option value="" disabled>Select Sample Program...</option>
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".cpp,.c,.h,.hpp,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-dark-100 border border-dark-600 rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition active:scale-95"
          title="Upload C/C++ Source File"
        >
          <Upload className="w-3.5 h-3.5 text-dark-400" />
          <span className="hidden md:inline">Upload</span>
        </button>

        {/* History Modal Trigger */}
        <button
          onClick={onOpenHistory}
          className="bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-dark-100 border border-dark-600 rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition active:scale-95 relative"
          title="View Last 10 Analysis Runs"
        >
          <History className="w-3.5 h-3.5 text-dark-400" />
          <span className="hidden md:inline">History</span>
          {historyCount > 0 && (
            <span className="bg-brand-blue text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {historyCount}
            </span>
          )}
        </button>

        {/* Export PDF */}
        <button
          onClick={onExportPDF}
          disabled={!hasAnalysis}
          className={`border rounded-md px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition active:scale-95 ${
            hasAnalysis
              ? 'bg-dark-800 hover:bg-dark-700 text-dark-200 border-dark-600 cursor-pointer'
              : 'bg-dark-900 text-dark-500 border-dark-700 cursor-not-allowed opacity-50'
          }`}
          title="Export Analysis Report to PDF"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Export PDF</span>
        </button>

        {/* Dark/Light Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-dark-100 border border-dark-600 rounded-md p-1.5 transition active:scale-95"
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          {isDark ? <Sun className="w-4 h-4 text-brand-yellow" /> : <Moon className="w-4 h-4 text-brand-blue" />}
        </button>

        {/* Primary Analyze Button */}
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="bg-brand-green hover:bg-emerald-600 active:scale-95 text-white font-semibold text-xs px-4 py-1.5 rounded-md flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Run Full Static Analysis (Ctrl + Enter)"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Analyze</span>
              <kbd className="hidden lg:inline-block bg-black/25 text-[10px] px-1.5 py-0.2 rounded text-emerald-100">
                Ctrl+Enter
              </kbd>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
