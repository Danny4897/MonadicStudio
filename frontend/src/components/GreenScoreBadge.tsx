import React from 'react';

interface Props {
  score?: number;
  size?: 'sm' | 'md';
}

export function GreenScoreBadge({ score, size = 'sm' }: Props) {
  if (score === undefined) {
    return (
      <span className={`inline-block rounded px-1 text-xs font-mono bg-[#30363d] text-[#8b949e] ${size === 'md' ? 'px-2 py-0.5' : ''}`}>
        –
      </span>
    );
  }

  const color =
    score >= 90
      ? 'bg-[#00ff8822] text-[#00ff88] border border-[#00ff8844]'
      : score >= 70
      ? 'bg-[#f9731622] text-[#f97316] border border-[#f9731644]'
      : 'bg-[#ef444422] text-[#ef4444] border border-[#ef444444]';

  return (
    <span className={`inline-block rounded px-1 text-xs font-mono ${color} ${size === 'md' ? 'px-2 py-0.5' : ''}`}>
      {score}
    </span>
  );
}
