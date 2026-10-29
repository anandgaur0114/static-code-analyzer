import React, { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Search, 
  Lightbulb, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function IssuesTab({ issues = [], onSelectLine }) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const filteredIssues = issues.filter((issue) => {
    if (severityFilter !== 'ALL' && issue.severity !== severityFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchType = (issue.type || '').toLowerCase().includes(q);
      const matchMsg = (issue.message || '').toLowerCase().includes(q);
      const matchSugg = (issue.suggestion || '').toLowerCase().includes(q);
      return matchType || matchMsg || matchSugg;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter and Search Bar */}
      <div className="p-3 bg-dark-800 border-b border-dark-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSeverityFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              severityFilter === 'ALL'
                ? 'bg-dark-600 text-dark-100 shadow-sm'
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700'
            }`}
          >
            All ({issues.length})
          </button>
          <button
            onClick={() => setSeverityFilter('error')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              severityFilter === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
                : 'text-dark-400 hover:text-red-400 hover:bg-dark-700'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Errors ({errorCount})</span>
          </button>
          <button
            onClick={() => setSeverityFilter('warning')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              severityFilter === 'warning'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-dark-400 hover:text-amber-400 hover:bg-dark-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Warnings ({warningCount})</span>
          </button>
          {infoCount > 0 && (
            <button
              onClick={() => setSeverityFilter('info')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                severityFilter === 'info'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-dark-400 hover:text-blue-400 hover:bg-dark-700'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Info ({infoCount})</span>
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-dark-500" />
          <input
            type="text"
            placeholder="Search diagnostics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-900 border border-dark-600 rounded-md pl-8 pr-3 py-1 text-xs text-dark-200 placeholder-dark-500 focus:outline-none focus:border-brand-blue"
          />
        </div>
      </div>

      {/* Issues List Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredIssues.length === 0 ? (
          issues.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-brand-green" />
              </div>
              <h3 className="text-base font-bold text-dark-100">Zero Code Quality Violations!</h3>
              <p className="text-xs text-dark-400 max-w-sm mt-1">
                Your code passed all lexical, syntactic, semantic, complexity, and security passes with 100% accuracy.
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-dark-400">
              <Search className="w-8 h-8 text-dark-600 mb-2" />
              <p className="text-xs">No issues match the selected filter criteria.</p>
            </div>
          )
        ) : (
          filteredIssues.map((iss, index) => {
            const isError = iss.severity === 'error';
            const isWarning = iss.severity === 'warning';
            const isSecurity = (iss.type || '').includes('Security');

            return (
              <div
                key={index}
                onClick={() => onSelectLine && onSelectLine(iss.line)}
                className={`p-3.5 rounded-lg border transition cursor-pointer hover:translate-x-0.5 shadow-sm group ${
                  isError
                    ? 'bg-red-500/5 hover:bg-red-500/10 border-red-500/30'
                    : isWarning
                    ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30'
                    : 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/30'
                }`}
              >
                {/* Issue Header */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                        isError
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      }`}
                    >
                      {isSecurity ? <ShieldAlert className="w-3 h-3" /> : (
                        isError ? <AlertCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />
                      )}
                      <span>{iss.severity}</span>
                    </span>
                    <span className="text-xs font-semibold text-dark-200">
                      {iss.type}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-dark-400 bg-dark-900 border border-dark-600 px-2 py-0.5 rounded group-hover:border-dark-400 transition">
                    Line {iss.line}:{iss.col}
                  </span>
                </div>

                {/* Issue Message */}
                <p className="text-xs text-dark-300 leading-relaxed pl-0.5 mb-2">
                  {iss.message}
                </p>

                {/* Actionable Suggestion */}
                {iss.suggestion && (
                  <div className="bg-dark-950/60 border border-dark-700/80 rounded p-2 text-[11px] text-dark-300 flex items-start gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-brand-yellow shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-dark-400 font-semibold mr-1">Recommendation:</span>
                      <span>{iss.suggestion}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
