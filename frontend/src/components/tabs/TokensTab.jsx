import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function TokensTab({ tokens = [] }) {
  const [search, setSearch] = useState('');

  const filtered = tokens.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.type || '').toLowerCase().includes(q) ||
      (t.value || '').toLowerCase().includes(q) ||
      String(t.line).includes(q)
    );
  });

  const getTokenStyle = (type) => {
    switch (type) {
      case 'KEYWORD':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'IDENTIFIER':
        return 'text-sky-400 bg-sky-400/10 border-sky-400/30';
      case 'LITERAL_INT':
      case 'LITERAL_FLOAT':
      case 'LITERAL_STRING':
      case 'LITERAL_CHAR':
      case 'LITERAL_BOOL':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'OPERATOR':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'DELIMITER':
        return 'text-dark-400 bg-dark-700 border-dark-600';
      case 'COMMENT':
        return 'text-dark-500 bg-dark-800 border-dark-700 italic';
      default:
        return 'text-dark-300 bg-dark-800 border-dark-700';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header & Search */}
      <div className="p-3 bg-dark-800 border-b border-dark-600 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-dark-200">DFA Token Stream</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-dark-700 text-dark-300">
            {tokens.length} Tokens
          </span>
        </div>
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-dark-500" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-900 border border-dark-600 rounded-md pl-8 pr-3 py-1 text-xs text-dark-200 placeholder-dark-500 focus:outline-none focus:border-brand-blue"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-dark-850 text-dark-400 font-semibold sticky top-0 z-10 border-b border-dark-600">
            <tr>
              <th className="px-3.5 py-2 w-12 text-center">#</th>
              <th className="px-3 py-2 w-16">Line</th>
              <th className="px-3 py-2 w-16">Col</th>
              <th className="px-3.5 py-2 w-32">Token Type</th>
              <th className="px-4 py-2">Lexeme / Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700 font-mono text-[11px]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-dark-500">
                  No tokens matching search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((t, idx) => (
                <tr key={idx} className="hover:bg-dark-800/60 transition">
                  <td className="px-3.5 py-1.5 text-center text-dark-500">{idx + 1}</td>
                  <td className="px-3 py-1.5 text-dark-400">{t.line}</td>
                  <td className="px-3 py-1.5 text-dark-400">{t.col}</td>
                  <td className="px-3.5 py-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTokenStyle(t.type)}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-1.5 text-dark-200">
                    <code className="bg-dark-950 px-1.5 py-0.5 rounded border border-dark-700">
                      {t.value}
                    </code>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
