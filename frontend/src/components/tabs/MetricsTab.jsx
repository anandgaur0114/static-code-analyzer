import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { 
  Award, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  SlidersHorizontal 
} from 'lucide-react';

export default function MetricsTab({ metrics = {}, issues = [] }) {
  const score = metrics.quality_score ?? 100.0;
  const grade = metrics.grade || 'A+';
  const desc = metrics.description || 'Clean Code';
  const deductions = metrics.deductions || [];
  const functions = metrics.function_metrics || [];

  // Issue Severity Distribution for Pie Chart
  const errCount = issues.filter((i) => i.severity === 'error').length;
  const warnCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const pieData = [
    { name: 'Errors', value: errCount, color: '#f85149' },
    { name: 'Warnings', value: warnCount, color: '#d29922' },
    { name: 'Info', value: infoCount, color: '#58a6ff' },
  ].filter((d) => d.value > 0);

  // Function Complexity data for Bar Chart
  const barData = functions.map((f) => ({
    name: f.name.length > 12 ? f.name.substring(0, 10) + '..' : f.name,
    complexity: f.complexity,
    loc: f.loc,
    nesting: f.nesting,
    fullName: f.name
  }));

  // Gauge colors based on score
  let scoreColor = '#3fb950'; // Green
  if (score < 40) scoreColor = '#f85149';
  else if (score < 75) scoreColor = '#d29922';
  else if (score < 90) scoreColor = '#58a6ff';

  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {/* Top Row: Circular Gauge & KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quality Score Radial Gauge Card */}
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#21262d"
                strokeWidth="9"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={scoreColor}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                style={{
                  strokeDashoffset: dashOffset,
                  transition: 'stroke-dashoffset 0.8s ease'
                }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black font-sans text-dark-100">{score.toFixed(1)}%</span>
              <span className="text-[10px] font-bold text-dark-400 tracking-wider">ACCURACY</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-black border"
              style={{
                color: scoreColor,
                borderColor: `${scoreColor}60`,
                backgroundColor: `${scoreColor}15`
              }}
            >
              GRADE {grade}
            </span>
          </div>
          <p className="text-xs text-dark-400 mt-1 max-w-[220px]">{desc}</p>
        </div>

        {/* Quick KPI Cards Grid */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-dark-400 text-xs">
              <span>Total Violations</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-dark-100">{issues.length}</span>
              <span className="text-[11px] text-dark-400">
                ({errCount} errors, {warnCount} warnings)
              </span>
            </div>
          </div>

          <div className="bg-dark-800 border border-dark-600 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-dark-400 text-xs">
              <span>Average Complexity</span>
              <Activity className="w-4 h-4 text-brand-purple" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-brand-purple">
                {metrics.cyclomatic_complexity || 0}
              </span>
              <span className="text-[11px] text-dark-400">
                McCabe V(G) [{metrics.risk_level || 'Low'} Risk]
              </span>
            </div>
          </div>

          <div className="bg-dark-800 border border-dark-600 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-dark-400 text-xs">
              <span>Functions Analyzed</span>
              <SlidersHorizontal className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-brand-blue">{functions.length}</span>
              <span className="text-[11px] text-dark-400">subroutines checked</span>
            </div>
          </div>

          <div className="bg-dark-800 border border-dark-600 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-dark-400 text-xs">
              <span>Total Lines of Code</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">{metrics.lines || 0}</span>
              <span className="text-[11px] text-dark-400">physical LOC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row: Severity Pie & Complexity Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Issues by Severity Pie Chart */}
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-dark-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>Issues by Severity</span>
          </h3>
          {pieData.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-dark-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-brand-green mb-1" />
              <span>Zero issues found! 100% clean code.</span>
            </div>
          ) : (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161b22',
                      borderColor: '#30363d',
                      fontSize: '12px',
                      borderRadius: '6px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs mt-1">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-dark-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Function Complexity Bar Chart */}
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-dark-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-brand-purple" />
            <span>Cyclomatic Complexity per Function</span>
          </h3>
          {barData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-dark-400 text-xs">
              No function definitions in source code.
            </div>
          ) : (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="name" stroke="#8b949e" fontSize={10} />
                  <YAxis stroke="#8b949e" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161b22',
                      borderColor: '#30363d',
                      fontSize: '12px',
                      borderRadius: '6px'
                    }}
                    formatter={(val, name, item) => [`${val}`, `Complexity V(G) (LOC: ${item.payload.loc})`]}
                  />
                  <Bar dataKey="complexity" fill="#8957e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Deductions Breakdown */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-dark-700 pb-2 mb-2">
          <span className="text-xs font-bold text-dark-200 uppercase tracking-wider">
            Accuracy Score Deductions
          </span>
          <span className="text-[11px] font-mono text-dark-400">Base Score: 100.0%</span>
        </div>
        {deductions.length === 0 ? (
          <div className="text-xs text-brand-green font-semibold py-1 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>No penalties applied. Perfect 100.0% accuracy maintained!</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {deductions.map((ded, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-dark-750">
                <span className="text-dark-300 flex items-center gap-2">
                  <span className="text-red-400 font-bold">✗</span>
                  <span>{ded.rule}</span>
                </span>
                <span className="font-mono font-bold text-red-400">-{ded.points.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Functions Metrics Table */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 bg-dark-850 border-b border-dark-600 flex items-center justify-between">
          <span className="text-xs font-bold text-dark-200 uppercase tracking-wider">
            Function Metrics & Complexity Table
          </span>
          <span className="text-[11px] text-dark-400">Thresholds: LOC &le; 50 | Nesting &le; 4 | V(G) &le; 10</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-dark-850 text-dark-400 font-semibold border-b border-dark-600">
              <tr>
                <th className="px-4 py-2">Function</th>
                <th className="px-4 py-2">Lines</th>
                <th className="px-4 py-2">LOC</th>
                <th className="px-4 py-2">Nesting Depth</th>
                <th className="px-4 py-2">Complexity V(G)</th>
                <th className="px-4 py-2 text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700 font-mono text-[11px]">
              {functions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-dark-500">
                    No functions defined.
                  </td>
                </tr>
              ) : (
                functions.map((fn, idx) => {
                  let badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
                  if (fn.risk === 'Moderate') badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                  else if (fn.risk === 'High' || fn.risk === 'Very High') badgeColor = 'bg-red-500/15 text-red-400 border-red-500/30';

                  return (
                    <tr key={idx} className="hover:bg-dark-750/50 transition">
                      <td className="px-4 py-2 font-bold text-dark-100">{fn.name}</td>
                      <td className="px-4 py-2 text-dark-300">{fn.lines}</td>
                      <td className="px-4 py-2 text-dark-300">{fn.loc}</td>
                      <td className="px-4 py-2 text-dark-300">{fn.nesting}</td>
                      <td className="px-4 py-2 text-dark-100 font-bold">{fn.complexity}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                          {fn.risk}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
