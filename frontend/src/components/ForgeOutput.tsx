import React, { useEffect, useRef } from 'react';

interface OutputLine {
  text: string;
  level: 'error' | 'warning' | 'info' | 'neutral';
}

interface Props {
  lines: OutputLine[];
  isRunning: boolean;
  onRun: () => void;
}

export function ForgeOutput({ lines, isRunning, onRun }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#30363d]">
        <span className="text-xs text-[#8b949e]">Forge Output</span>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="text-xs px-2 py-1 rounded bg-[#00ff8822] text-[#00ff88] border border-[#00ff8844]
            hover:bg-[#00ff8833] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? '⟳ Analisi...' : '▶ Esegui Forge'}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {lines.length === 0 && (
          <span className="text-[#484f58] italic">Nessun output — esegui Forge o premi Ctrl+Shift+G nell'editor</span>
        )}
        {lines.map((line, i) => (
          <div key={i} className={`forge-${line.level} leading-5`}>
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
