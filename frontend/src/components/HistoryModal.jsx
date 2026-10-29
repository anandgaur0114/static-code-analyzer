import React from 'react';
import { X, Clock, Trash2, ArrowRight, Award } from 'lucide-react';

export default function HistoryModal({
  isOpen,
  onClose,
  history = [],
  onSelectHistory,
  onClearHistory
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-dark-850 border border-dark-600 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-dark-600 flex items-center justify-between bg-dark-800">
          <div className="flex items-center gap-2 text-dark-100 font-bold text-sm">
            <Clock className="w-4 h-4 text-brand-blue" />
            <span>Analysis History (Last 10 Runs)</span>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-dark-700 transition"
                title="Clear All History"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-dark-400 hover:text-dark-100 hover:bg-dark-700 transition"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="p-4 overflow-y-auto divide-y divide-dark-700 space-y-2">
          {history.length === 0 ? (
            <div className="py-12 text-center text-dark-400 text-xs">
              No recent analysis runs recorded in localStorage.
            </div>
          ) : (
            history.map((item, index) => {
              const score = item.analysis?.metrics?.quality_score ?? 100;
              const grade = item.analysis?.metrics?.grade || 'A+';
              const issuesCount = item.analysis?.issues?.length || 0;

              return (
                <div
                  key={index}
                  onClick={() => {
                    onSelectHistory(item);
                    onClose();
                  }}
                  className="p-3 rounded-lg hover:bg-dark-800 border border-transparent hover:border-dark-600 transition cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-dark-400">
                        {new Date(item.timestamp).toLocaleTimeString()} • {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.2 rounded bg-dark-700 text-dark-300">
                        {item.code.split('\n').length} lines
                      </span>
                    </div>
                    <p className="text-xs font-mono text-dark-300 truncate">
                      {item.code.trim().split('\n')[0] || '// C++ Code'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-dark-100 flex items-center justify-end gap-1">
                        <span>{score.toFixed(1)}%</span>
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-dark-700 text-brand-green">
                          {grade}
                        </span>
                      </div>
                      <span className="text-[10px] text-dark-400">
                        {issuesCount} issues
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-brand-blue group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
