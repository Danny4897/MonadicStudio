import React from 'react';
import { PipelineStep } from '../parser/ropParser';

interface Props {
  steps: PipelineStep[];
  selectedId: string | null;
  onSelect: (step: PipelineStep) => void;
}

const METHOD_COLORS: Record<string, string> = {
  Bind: '#00ff88',
  Map: '#f97316',
  Match: '#00ff88',
  Try: '#58a6ff',
  CachingAgent: '#a78bfa',
  CircuitBreaker: '#f97316',
  WithRetry: '#f97316',
  Other: '#8b949e',
};

const STEP_HEIGHT = 64;
const STEP_WIDTH = 200;
const SVG_PADDING = 20;
const CONNECTOR_HEIGHT = 28;

export function RailwayVisualizer({ steps, selectedId, onSelect }: Props) {
  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#8b949e] text-xs text-center p-4">
        <span className="text-2xl mb-2">🛤</span>
        <p>Nessuna pipeline rilevata.</p>
        <p className="mt-1">Apri un file con <code className="text-[#00ff88]">.Bind(</code> o <code className="text-[#00ff88]">.Map(</code></p>
      </div>
    );
  }

  const totalHeight =
    SVG_PADDING * 2 +
    steps.length * STEP_HEIGHT +
    (steps.length - 1) * CONNECTOR_HEIGHT;

  const svgWidth = STEP_WIDTH + SVG_PADDING * 2 + 60; // extra for failure path

  return (
    <svg
      width="100%"
      height={totalHeight}
      viewBox={`0 0 ${svgWidth} ${totalHeight}`}
      className="overflow-visible"
    >
      {steps.map((step, idx) => {
        const x = SVG_PADDING;
        const y = SVG_PADDING + idx * (STEP_HEIGHT + CONNECTOR_HEIGHT);
        const cx = x + STEP_WIDTH / 2;
        const color = METHOD_COLORS[step.method] ?? '#8b949e';
        const isSelected = step.id === selectedId;
        const isTerminator = step.method === 'Match';

        return (
          <g key={step.id}>
            {/* connector from previous step */}
            {idx > 0 && (
              <g>
                {/* happy path arrow */}
                <line
                  x1={cx} y1={y - CONNECTOR_HEIGHT}
                  x2={cx} y2={y - 4}
                  stroke="#00ff88" strokeWidth="1.5"
                />
                <polygon
                  points={`${cx - 4},${y - 6} ${cx + 4},${y - 6} ${cx},${y - 1}`}
                  fill="#00ff88"
                />
                {/* failure path dashed arrow */}
                <line
                  x1={cx + STEP_WIDTH / 2} y1={y - CONNECTOR_HEIGHT + 4}
                  x2={svgWidth - 14} y2={y - CONNECTOR_HEIGHT + 4}
                  stroke="#ef4444" strokeWidth="1" strokeDasharray="4 3"
                />
                <polygon
                  points={`${svgWidth - 14},${y - CONNECTOR_HEIGHT},${svgWidth - 14},${y - CONNECTOR_HEIGHT + 8},${svgWidth - 6},${y - CONNECTOR_HEIGHT + 4}`}
                  fill="#ef4444"
                />
              </g>
            )}

            {/* step box */}
            <rect
              x={x} y={y}
              width={STEP_WIDTH} height={STEP_HEIGHT - 4}
              rx="6" ry="6"
              fill={isSelected ? `${color}22` : '#161b22'}
              stroke={isTerminator ? '#00ff88' : isSelected ? color : '#30363d'}
              strokeWidth={isSelected ? 2 : 1}
              className="cursor-pointer"
              onClick={() => onSelect(step)}
            />

            {/* icons */}
            <text x={x + 10} y={y + 20} fontSize="13" className="select-none">
              {step.hasCache && '💾'}
              {step.hasCircuitBreaker && '⚡'}
              {step.hasRetry && `🔄`}
              {isTerminator && '✓'}
              {!step.hasCache && !step.hasCircuitBreaker && !step.hasRetry && !isTerminator && getMethodIcon(step.method)}
            </text>

            {/* retry count */}
            {step.hasRetry && step.retryCount && (
              <text x={x + 24} y={y + 20} fontSize="10" fill={color}>
                ×{step.retryCount}
              </text>
            )}

            {/* method label */}
            <text
              x={cx} y={y + 24}
              fontSize="11"
              fill={color}
              textAnchor="middle"
              fontFamily="JetBrains Mono, Fira Code, monospace"
              fontWeight="600"
            >
              {step.method}
            </text>

            {/* function label */}
            <text
              x={cx} y={y + 42}
              fontSize="10"
              fill="#8b949e"
              textAnchor="middle"
              fontFamily="JetBrains Mono, Fira Code, monospace"
            >
              {truncate(step.label, 22)}
            </text>

            {/* line number */}
            <text
              x={x + STEP_WIDTH - 6} y={y + STEP_HEIGHT - 8}
              fontSize="9"
              fill="#484f58"
              textAnchor="end"
            >
              L{step.lineNumber}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function getMethodIcon(method: string): string {
  switch (method) {
    case 'Bind': return '→';
    case 'Map': return '↦';
    case 'Try': return '⚙';
    case 'Other': return '·';
    default: return '';
  }
}
