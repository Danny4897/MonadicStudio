import React, { useState } from 'react';
import { ForgeViolation } from '../types';
import { ForgeOutput } from '../components/ForgeOutput';
import { ProblemsList } from '../components/ProblemsList';
import { GreenScoreGauge } from '../components/GreenScoreGauge';

interface OutputLine {
  text: string;
  level: 'error' | 'warning' | 'info' | 'neutral';
}

interface Props {
  violations: ForgeViolation[];
  score: number;
  scoreDelta: number | undefined;
  lastAnalyzed: string;
  outputLines: OutputLine[];
  isAnalyzing: boolean;
  onGoToLine: (line: number) => void;
  onRunForge: () => void;
  onMigrate: () => void;
}

type Tab = 'output' | 'problems' | 'score';

export function BottomPanel({
  violations,
  score,
  scoreDelta,
  lastAnalyzed,
  outputLines,
  isAnalyzing,
  onGoToLine,
  onRunForge,
  onMigrate,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('output');
  const [showMigrateModal, setShowMigrateModal] = useState(false);

  const errorCount = violations.filter((v) => v.severity === 'error').length;
  const warnCount = violations.filter((v) => v.severity === 'warning').length;

  const tabs: Array<{ id: Tab; label: string; badge?: string }> = [
    { id: 'output', label: 'Output' },
    {
      id: 'problems',
      label: 'Problems',
      badge:
        errorCount > 0
          ? `${errorCount}E`
          : warnCount > 0
          ? `${warnCount}W`
          : undefined,
    },
    { id: 'score', label: 'Score' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#161b22] border-t border-[#30363d]">
      {/* Tab bar */}
      <div className="flex items-center border-b border-[#30363d] px-2 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs px-3 py-1.5 border-b-2 transition-colors flex items-center gap-1
              ${activeTab === tab.id
                ? 'border-[#00ff88] text-[#e6edf3]'
                : 'border-transparent text-[#8b949e] hover:text-[#e6edf3]'
              }`}
          >
            {tab.label}
            {tab.badge && (
              <span className={`text-xs rounded px-1 ${
                tab.badge.includes('E') ? 'text-[#ef4444]' : 'text-[#f97316]'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'output' && (
          <ForgeOutput lines={outputLines} isRunning={isAnalyzing} onRun={onRunForge} />
        )}
        {activeTab === 'problems' && (
          <ProblemsList violations={violations} onGoToLine={onGoToLine} />
        )}
        {activeTab === 'score' && (
          <div className="flex flex-col items-center justify-between h-full p-2">
            <GreenScoreGauge
              score={score}
              delta={scoreDelta}
              lastAnalyzed={lastAnalyzed || undefined}
            />
            <button
              onClick={() => setShowMigrateModal(true)}
              className="text-xs px-3 py-1.5 rounded border border-[#00ff8844] text-[#00ff88]
                hover:bg-[#00ff8822] transition-colors"
            >
              ⚡ Fix Auto-Fixable
            </button>
          </div>
        )}
      </div>

      {/* Migrate confirm modal */}
      {showMigrateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-bold text-[#e6edf3] mb-2">Conferma Migrazione</h3>
            <p className="text-xs text-[#8b949e] mb-4">
              Eseguirà <code className="text-[#00ff88]">dotnet forge migrate</code> sul file corrente.
              Le modifiche saranno applicate al disco. Procedere?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowMigrateModal(false)}
                className="text-xs px-3 py-1.5 rounded border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  setShowMigrateModal(false);
                  onMigrate();
                }}
                className="text-xs px-3 py-1.5 rounded bg-[#00ff8822] text-[#00ff88] border border-[#00ff8844] hover:bg-[#00ff8833] transition-colors"
              >
                Procedi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
