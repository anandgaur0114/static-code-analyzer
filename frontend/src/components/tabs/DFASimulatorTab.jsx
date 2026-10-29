import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const DFA_STATES = [
  { id: 'START', label: 'START (q0)', x: 90, y: 150, color: '#58a6ff' },
  { id: 'IN_IDENT', label: 'IN_IDENT', x: 260, y: 70, color: '#bc8cff' },
  { id: 'IN_NUMBER', label: 'IN_NUMBER', x: 260, y: 230, color: '#3fb950' },
  { id: 'IN_FLOAT', label: 'IN_FLOAT', x: 420, y: 230, color: '#39c5bb' },
  { id: 'IN_STRING', label: 'IN_STRING', x: 260, y: 310, color: '#f0883e' },
  { id: 'IN_CHAR', label: 'IN_CHAR', x: 260, y: 390, color: '#d29922' },
  { id: 'EMIT_OPERATOR', label: 'OPERATOR', x: 420, y: 70, color: '#d2a8ff' },
  { id: 'EMIT_DELIMITER', label: 'DELIMITER', x: 420, y: 150, color: '#8b949e' },
  { id: 'IN_COMMENT_SINGLE', label: 'COMMENT', x: 420, y: 310, color: '#6e7681' },
];

export default function DFASimulatorTab({ trace = [], sourceCode = '' }) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x
  const timerRef = useRef(null);

  const totalSteps = trace.length;
  const currentStep = trace[currentStepIdx] || null;

  // Autoplay loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(80, 500 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, totalSteps]);

  const handlePlayToggle = () => {
    if (currentStepIdx >= totalSteps - 1) {
      setCurrentStepIdx(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handleStepBackward = () => {
    setIsPlaying(false);
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleFirstStep = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
  };

  const handleLastStep = () => {
    setIsPlaying(false);
    setCurrentStepIdx(Math.max(0, totalSteps - 1));
  };

  // Compute accumulated emitted tokens up to this step
  const emittedTokensSoFar = [];
  for (let i = 0; i <= currentStepIdx; i++) {
    if (trace[i]?.emitted_token) {
      emittedTokensSoFar.push(trace[i].emitted_token);
    }
  }

  // Active state ID
  const activeStateId = currentStep ? currentStep.to_state : 'START';

  // Tape window: 5 chars before and 5 chars after
  const cursor = currentStep?.cursor ?? 0;
  const tapeStart = Math.max(0, cursor - 4);
  const tapeEnd = Math.min(sourceCode.length, cursor + 7);
  const tapeChars = [];
  for (let i = tapeStart; i < tapeEnd; i++) {
    const c = sourceCode[i];
    let display = c;
    if (c === ' ') display = '␣';
    else if (c === '\n') display = '\\n';
    else if (c === '\t') display = '\\t';
    tapeChars.push({
      index: i,
      display,
      isCurrent: i === cursor
    });
  }

  if (totalSteps === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-dark-400">
        <Cpu className="w-8 h-8 text-dark-600 mb-2" />
        <p className="text-xs">No DFA execution trace available. Run analysis on code to generate state transitions.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-dark-950 overflow-hidden select-none">
      {/* Top Playback Toolbar */}
      <div className="p-3 bg-dark-850 border-b border-dark-600 flex items-center justify-between gap-3 flex-wrap shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-brand-purple/20 border border-brand-purple/40 flex items-center justify-center text-brand-purple">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-dark-100 flex items-center gap-1.5">
              Lexical DFA State Machine Animator
            </span>
            <span className="text-[10px] text-dark-400 block font-mono">
              Step {currentStepIdx + 1} of {totalSteps} • Transition: {currentStep?.from_state || 'START'} ➔ {currentStep?.to_state || 'START'}
            </span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleFirstStep}
            disabled={currentStepIdx === 0}
            className="p-1.5 rounded bg-dark-800 hover:bg-dark-700 text-dark-300 disabled:opacity-40 transition"
            title="First Step"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleStepBackward}
            disabled={currentStepIdx === 0}
            className="p-1.5 rounded bg-dark-800 hover:bg-dark-700 text-dark-300 disabled:opacity-40 transition"
            title="Step Backward"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handlePlayToggle}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
              isPlaying
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'bg-brand-blue text-white hover:bg-blue-600 shadow-md shadow-blue-900/30'
            }`}
            title={isPlaying ? "Pause Simulation" : "Play Animated Trace"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={handleStepForward}
            disabled={currentStepIdx >= totalSteps - 1}
            className="p-1.5 rounded bg-dark-800 hover:bg-dark-700 text-dark-300 disabled:opacity-40 transition"
            title="Step Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleLastStep}
            disabled={currentStepIdx >= totalSteps - 1}
            className="p-1.5 rounded bg-dark-800 hover:bg-dark-700 text-dark-300 disabled:opacity-40 transition"
            title="Fast Forward to End"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 ml-2 bg-dark-800 border border-dark-600 rounded p-0.5 text-[10px] font-mono">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded transition ${
                  playbackSpeed === spd
                    ? 'bg-brand-blue text-white font-bold'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step Scrubber Slider */}
      <div className="bg-dark-900 px-4 py-1.5 border-b border-dark-700 flex items-center gap-3 text-xs text-dark-400">
        <span className="font-mono text-[11px] w-14 shrink-0">Step {currentStepIdx + 1}</span>
        <input
          type="range"
          min={0}
          max={totalSteps - 1}
          value={currentStepIdx}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentStepIdx(Number(e.target.value));
          }}
          className="flex-1 accent-brand-blue cursor-pointer h-1.5 bg-dark-700 rounded-lg"
        />
        <span className="font-mono text-[11px] w-14 text-right shrink-0">{totalSteps} Total</span>
      </div>

      {/* Automata Tape Viewer (Tape Head pointer) */}
      <div className="bg-dark-900/90 border-b border-dark-700 px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-dark-400 uppercase tracking-wider">
            Input Tape Head:
          </span>
          <div className="flex items-center gap-1 font-mono">
            {tapeChars.map((t, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold border transition ${
                  t.isCurrent
                    ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/30 scale-110 z-10'
                    : 'bg-dark-800 text-dark-400 border-dark-700'
                }`}
              >
                {t.display}
              </div>
            ))}
          </div>
        </div>

        {/* Current & Lookahead info */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-dark-800 border border-dark-600 px-2.5 py-1 rounded">
            <span className="text-dark-400">Current: </span>
            <span className="text-brand-blue font-bold">'{currentStep?.char_display}'</span>
          </div>
          <div className="bg-dark-800 border border-dark-600 px-2.5 py-1 rounded">
            <span className="text-dark-400">Lookahead: </span>
            <span className="text-brand-green font-bold">'{currentStep?.next_char}'</span>
          </div>
          <div className="bg-dark-800 border border-dark-600 px-2.5 py-1 rounded">
            <span className="text-dark-400">Buffer: </span>
            <span className="text-amber-400 font-bold">"{currentStep?.buffer || ''}"</span>
          </div>
        </div>
      </div>

      {/* Main Simulation Viewport: State Machine SVG & Live Emitted Stream */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
        {/* Left 2 Cols: Visual DFA State Diagram */}
        <div className="lg:col-span-2 relative h-full flex flex-col justify-between p-4 bg-gradient-to-b from-dark-950 to-dark-900 overflow-auto">
          {/* Action Callout Pill */}
          <div className="mb-2 bg-dark-800/90 border border-dark-600 rounded-lg p-2.5 flex items-center gap-2.5 shadow-md">
            <Sparkles className="w-4 h-4 text-brand-yellow shrink-0" />
            <div className="text-xs">
              <span className="text-dark-400 font-semibold mr-1.5">Action:</span>
              <span className="text-dark-100 font-medium">{currentStep?.action}</span>
            </div>
          </div>

          {/* SVG DFA State Machine */}
          <div className="flex-1 flex items-center justify-center">
            <svg viewBox="0 0 540 450" className="w-full max-w-[540px] h-full max-h-[420px]">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#484f58" />
                </marker>
              </defs>

              {/* Connecting lines from START to states */}
              <line x1="90" y1="150" x2="260" y2="70" stroke="#30363d" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="90" y1="150" x2="260" y2="230" stroke="#30363d" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="260" y1="230" x2="420" y2="230" stroke="#30363d" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="90" y1="150" x2="260" y2="310" stroke="#30363d" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="90" y1="150" x2="260" y2="390" stroke="#30363d" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="90" y1="150" x2="420" y2="70" stroke="#30363d" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="90" y1="150" x2="420" y2="150" stroke="#30363d" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="90" y1="150" x2="420" y2="310" stroke="#30363d" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* Render State Nodes */}
              {DFA_STATES.map((st) => {
                const isActive = activeStateId === st.id;
                const isAccepting = st.id.startsWith('EMIT') || st.id === 'START';

                return (
                  <g key={st.id} transform={`translate(${st.x}, ${st.y})`}>
                    {/* Glowing pulse ring if active */}
                    {isActive && (
                      <circle
                        r="32"
                        fill="none"
                        stroke={st.color}
                        strokeWidth="2.5"
                        className="animate-ping opacity-40"
                      />
                    )}

                    {/* Outer circle for accepting state */}
                    {isAccepting && (
                      <circle
                        r="28"
                        fill="none"
                        stroke={isActive ? st.color : '#30363d'}
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Main State Circle */}
                    <circle
                      r="24"
                      fill={isActive ? st.color : '#161b22'}
                      stroke={isActive ? '#ffffff' : '#484f58'}
                      strokeWidth={isActive ? '2.5' : '1.5'}
                      className="transition-colors duration-200"
                    />

                    {/* State Label */}
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill={isActive ? '#ffffff' : '#c9d1d9'}
                      fontSize="9px"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      {st.id === 'START' ? 'q0' : st.label.substring(0, 8)}
                    </text>

                    {/* State Name Annotation */}
                    <text
                      textAnchor="middle"
                      dy="38"
                      fill={isActive ? st.color : '#8b949e'}
                      fontSize="8.5px"
                      fontFamily="Inter, sans-serif"
                      fontWeight={isActive ? 'bold' : 'normal'}
                    >
                      {st.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right 1 Col: Live Emitted Tokens Log */}
        <div className="bg-dark-900 border-l border-dark-600 flex flex-col h-full overflow-hidden">
          <div className="p-3 bg-dark-850 border-b border-dark-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-brand-green" />
              <span className="text-xs font-bold text-dark-100">Accepted Token Stream</span>
            </div>
            <span className="text-[10px] font-mono bg-dark-700 px-2 py-0.5 rounded text-dark-300">
              {emittedTokensSoFar.length} Emitted
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-xs">
            {emittedTokensSoFar.length === 0 ? (
              <div className="text-center py-12 text-dark-500 text-xs">
                Scanning input tape... No tokens accepted yet.
              </div>
            ) : (
              emittedTokensSoFar.map((tok, i) => (
                <div
                  key={i}
                  className="bg-dark-800 border border-dark-700 rounded p-2 flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-dark-950 border border-dark-700 text-brand-blue">
                      {tok.type}
                    </span>
                    <span className="text-dark-100 font-bold truncate">'{tok.value}'</span>
                  </div>
                  <span className="text-[10px] text-dark-500 shrink-0">
                    Line {tok.line}:{tok.col}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
