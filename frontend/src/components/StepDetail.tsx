import React from 'react';
import { PipelineStep, getStepSuggestion } from '../parser/ropParser';

interface Props {
  step: PipelineStep | null;
}

export function StepDetail({ step }: Props) {
  if (!step) {
    return (
      <div className="p-3 text-[#8b949e] text-xs italic">
        Clicca uno step per vedere i dettagli
      </div>
    );
  }

  const suggestion = getStepSuggestion(step);

  return (
    <div className="p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#00ff88] font-mono">{step.method}</span>
        <span className="text-xs text-[#8b949e]">→</span>
        <span className="text-xs text-[#e6edf3] font-mono">{step.label}</span>
        <span className="ml-auto text-xs text-[#484f58]">L{step.lineNumber}</span>
      </div>

      {(step.hasRetry || step.hasCache || step.hasCircuitBreaker) && (
        <div className="flex gap-2 flex-wrap">
          {step.hasRetry && (
            <span className="text-xs bg-[#f9731622] text-[#f97316] rounded px-1.5 py-0.5 border border-[#f9731644]">
              retry ×{step.retryCount ?? 3}
            </span>
          )}
          {step.hasCache && (
            <span className="text-xs bg-[#a78bfa22] text-[#a78bfa] rounded px-1.5 py-0.5 border border-[#a78bfa44]">
              cached
            </span>
          )}
          {step.hasCircuitBreaker && (
            <span className="text-xs bg-[#f9731622] text-[#f97316] rounded px-1.5 py-0.5 border border-[#f9731644]">
              circuit-breaker
            </span>
          )}
        </div>
      )}

      <div className="bg-[#0d1117] rounded border border-[#30363d] p-2">
        <pre className="text-xs text-[#e6edf3] font-mono whitespace-pre-wrap leading-relaxed">
          {suggestion}
        </pre>
        <button
          className="mt-2 text-xs text-[#8b949e] hover:text-[#00ff88] transition-colors"
          onClick={() => navigator.clipboard.writeText(suggestion)}
        >
          📋 Copia
        </button>
      </div>
    </div>
  );
}
