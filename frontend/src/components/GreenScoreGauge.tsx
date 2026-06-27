import React from 'react';

interface Props {
  score: number;
  delta?: number;
  lastAnalyzed?: string;
}

export function GreenScoreGauge({ score, delta, lastAnalyzed }: Props) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  const color =
    score >= 90 ? '#00ff88' : score >= 70 ? '#f97316' : '#ef4444';

  const label =
    score >= 90 ? 'Ottimo' : score >= 70 ? 'Buono' : 'Basso';

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* track */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none" stroke="#30363d" strokeWidth="10"
          />
          {/* progress */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-mono" style={{ color }}>{score}</span>
          <span className="text-xs text-[#8b949e]">{label}</span>
        </div>
      </div>

      {delta !== undefined && (
        <span
          className={`text-sm font-mono font-bold ${delta >= 0 ? 'text-[#00ff88]' : 'text-[#ef4444]'}`}
        >
          {delta >= 0 ? '+' : ''}{delta} {delta >= 0 ? '▲' : '▼'}
        </span>
      )}

      {lastAnalyzed && (
        <span className="text-xs text-[#8b949e]">Ultima analisi: {lastAnalyzed}</span>
      )}
    </div>
  );
}
