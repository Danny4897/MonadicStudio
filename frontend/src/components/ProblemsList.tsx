import React, { useState } from 'react';
import { ForgeViolation } from '../types';

interface Props {
  violations: ForgeViolation[];
  onGoToLine: (line: number) => void;
}

const SEV_COLORS: Record<string, string> = {
  error: 'text-[#ef4444]',
  warning: 'text-[#f97316]',
  info: 'text-[#58a6ff]',
};

export function ProblemsList({ violations, onGoToLine }: Props) {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const filtered =
    filter === 'all' ? violations : violations.filter((v) => v.severity === filter);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#30363d]">
        {(['all', 'error', 'warning', 'info'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilter(sev)}
            className={`text-xs px-2 py-0.5 rounded border transition-colors
              ${filter === sev
                ? 'bg-[#21262d] border-[#484f58] text-[#e6edf3]'
                : 'border-transparent text-[#8b949e] hover:text-[#e6edf3]'
              }`}
          >
            {sev === 'all' ? `Tutti (${violations.length})` : sev}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="p-3 text-xs text-[#8b949e] italic">
            {violations.length === 0 ? 'Nessun problema rilevato ✓' : 'Nessun elemento in questa categoria'}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#161b22]">
              <tr className="text-[#8b949e]">
                <th className="text-left px-3 py-1.5 font-normal w-20">Regola</th>
                <th className="text-left px-2 py-1.5 font-normal w-10">Riga</th>
                <th className="text-left px-2 py-1.5 font-normal">Messaggio</th>
                <th className="text-left px-2 py-1.5 font-normal w-16">Severità</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr
                  key={i}
                  className="cursor-pointer hover:bg-[#21262d] border-t border-[#21262d]"
                  onClick={() => onGoToLine(v.line)}
                >
                  <td className="px-3 py-1.5 font-mono text-[#00ff88]">{v.rule}</td>
                  <td className="px-2 py-1.5 font-mono text-[#8b949e]">{v.line}</td>
                  <td className="px-2 py-1.5 text-[#e6edf3] truncate max-w-xs">{v.message}</td>
                  <td className={`px-2 py-1.5 font-mono ${SEV_COLORS[v.severity] ?? ''}`}>
                    {v.severity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
