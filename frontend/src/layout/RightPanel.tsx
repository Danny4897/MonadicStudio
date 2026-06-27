import React, { useState } from 'react';
import { PipelineStep } from '../parser/ropParser';
import { RailwayVisualizer } from '../components/RailwayVisualizer';
import { StepDetail } from '../components/StepDetail';

interface Props {
  steps: PipelineStep[];
}

export function RightPanel({ steps }: Props) {
  const [selectedStep, setSelectedStep] = useState<PipelineStep | null>(null);

  return (
    <div className="flex flex-col h-full bg-[#161b22] border-l border-[#30363d]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#30363d] flex items-center justify-between">
        <span className="text-xs font-bold text-[#00ff88] uppercase tracking-wider">
          Railway Visualizer
        </span>
        <span className="text-xs text-[#484f58]">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Visualizer — scrollable */}
      <div className="flex-1 overflow-auto p-2">
        <RailwayVisualizer
          steps={steps}
          selectedId={selectedStep?.id ?? null}
          onSelect={(step) => setSelectedStep(step.id === selectedStep?.id ? null : step)}
        />
      </div>

      {/* Step detail */}
      <div className="border-t border-[#30363d] max-h-48 overflow-auto">
        <div className="px-3 py-1.5 text-xs text-[#8b949e] border-b border-[#21262d]">
          Step Detail
        </div>
        <StepDetail step={selectedStep} />
      </div>
    </div>
  );
}
