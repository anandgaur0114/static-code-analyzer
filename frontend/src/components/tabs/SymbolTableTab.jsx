import React, { useState } from 'react';
import { Search, ArrowUpDown, Layers } from 'lucide-react';

export default function SymbolTableTab({ symbols = [] }) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('line');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filtered = symbols.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.type || '').toLowerCase().includes(q) ||
      (s.scope || '').toLowerCase().includes(q) ||
      String(s.line).includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header & Search */}
      <div className="p-3 bg-dark-800 border-b border-dark-600 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-purple" />
          <span className="text-xs font-semibold text-dark-200">Scoped Symbol Table</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-dark-700 text-dark-300">
            {symbols.length} Identifiers
          </span>
        </div>
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-dark-500" />
          <input
            type="text"
            placeholder="Search identifiers or scopes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-900 border border-dark-600 rounded-md pl-8 pr-3 py-1 text-xs text-dark-200 placeholder-dark-500 focus:outline-none focus:border-brand-blue"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-dark-850 text-dark-400 font-semibold sticky top-0 z-10 border-b border-dark-600 select-none">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-4 py-2 cursor-pointer hover:text-dark-100 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Symbol Name</span>
                  <ArrowUpDown className="w-3 h-3 text-dark-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('type')}
                className="px-4 py-2 cursor-pointer hover:text-dark-100 transition w-32"
              >
                <div className="flex items-center gap-1.5">
                  <span>Type</span>
                  <ArrowUpDown className="w-3 h-3 text-dark-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('scope')}
                className="px-4 py-2 cursor-pointer hover:text-dark-100 transition w-36"
              >
                <div className="flex items-center gap-1.5">
                  <span>Scope Level</span>
                  <ArrowUpDown className="w-3 h-3 text-dark-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('line')}
                className="px-4 py-2 cursor-pointer hover:text-dark-100 transition w-24 text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Declared Line</span>
                  <ArrowUpDown className="w-3 h-3 text-dark-500" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700 font-mono text-[11px]">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-dark-500">
                  No symbols matching search criteria.
                </td>
              </tr>
            ) : (
              sorted.map((s, idx) => (
                <tr key={idx} className="hover:bg-dark-800/60 transition">
                  <td className="px-4 py-2 text-dark-100 font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue"></span>
                    <span>{s.name}</span>
                  </td>
                  <td className="px-4 py-2 text-brand-purple">
                    <code className="bg-dark-950 px-1.5 py-0.5 rounded border border-dark-700">
                      {s.type}
                    </code>
                  </td>
                  <td className="px-4 py-2 text-dark-300">
                    <span className="px-2 py-0.5 rounded bg-dark-700 text-dark-300 border border-dark-600">
                      {s.scope}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-dark-400">
                    Line {s.line}
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
