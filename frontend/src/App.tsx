import React, { useState, useCallback, useRef } from 'react';
import { FileNode, ForgeViolation, WsEvent } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { useForge } from './hooks/useForge';
import { useRailwayParser } from './hooks/useRailwayParser';
import { LeftPanel } from './layout/LeftPanel';
import { CenterPanel } from './layout/CenterPanel';
import { RightPanel } from './layout/RightPanel';
import { BottomPanel } from './layout/BottomPanel';

interface OutputLine {
  text: string;
  level: 'error' | 'warning' | 'info' | 'neutral';
}

export default function App() {
  const [activePath, setActivePath] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [violations, setViolations] = useState<ForgeViolation[]>([]);
  const [score, setScore] = useState(0);
  const [prevScore, setPrevScore] = useState<number | undefined>(undefined);
  const [lastAnalyzed, setLastAnalyzed] = useState('');
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [forgeUnavailableBanner, setForgeUnavailableBanner] = useState<string | null>(null);

  const goToLineRef = useRef<((line: number) => void) | null>(null);

  const { isAnalyzing, analyze, migrate } = useForge();

  // Railway pipeline from current editor content
  const pipelineSteps = useRailwayParser(editorContent);

  // WebSocket event handler
  const handleWsEvent = useCallback((event: WsEvent) => {
    switch (event.type) {
      case 'forge-result': {
        setViolations(event.violations);
        setPrevScore(score);
        setScore(event.score);
        setLastAnalyzed(new Date().toLocaleTimeString('it-IT'));
        // Add output lines from violations
        setOutputLines((prev) => [
          ...prev,
          {
            text: `[${new Date().toLocaleTimeString('it-IT')}] Analisi completata — Score: ${event.score} | Violations: ${event.violations.length}`,
            level: 'info',
          },
          ...event.violations.map((v) => ({
            text: `  ${v.rule} L${v.line}: ${v.message}`,
            level: v.severity as OutputLine['level'],
          })),
        ]);
        break;
      }
      case 'forge-unavailable': {
        setForgeUnavailableBanner(event.message);
        setOutputLines((prev) => [
          ...prev,
          { text: `⚠ ${event.message}`, level: 'warning' },
        ]);
        break;
      }
      case 'forge-output': {
        setOutputLines((prev) => [
          ...prev,
          { text: event.line, level: event.level },
        ]);
        break;
      }
      case 'file-saved': {
        setOutputLines((prev) => [
          ...prev,
          {
            text: `[${event.timestamp}] Salvato: ${event.path.split(/[/\\]/).pop()}`,
            level: 'neutral',
          },
        ]);
        break;
      }
    }
  }, [score]);

  useWebSocket(handleWsEvent);

  const handleFileSelect = useCallback(async (node: FileNode) => {
    if (node.type !== 'file') return;
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(node.path)}`);
      if (res.ok) {
        const data = await res.json() as { content: string; path: string };
        setActivePath(data.path);
        setEditorContent(data.content);
        setViolations([]);
        setOutputLines([]);
        setPrevScore(undefined);
        // Auto-analyze on open
        analyze(data.path).catch(() => {});
      }
    } catch {
      setOutputLines((prev) => [...prev, { text: 'Errore nel caricare il file', level: 'error' }]);
    }
  }, [analyze]);

  const handleForceAnalyze = useCallback(() => {
    if (activePath) {
      setOutputLines((prev) => [
        ...prev,
        { text: `[Forge] Analisi manuale su: ${activePath.split(/[/\\]/).pop()}`, level: 'info' },
      ]);
      analyze(activePath).catch(() => {});
    }
  }, [activePath, analyze]);

  const handleMigrate = useCallback(async () => {
    if (!activePath) return;
    const result = await migrate(activePath);
    if (result) {
      setOutputLines((prev) => [
        ...prev,
        { text: `[Forge] Migrate completato: ${result.migrated} violazioni corrette`, level: 'info' },
      ]);
      // re-analyze
      analyze(activePath).catch(() => {});
    }
  }, [activePath, migrate, analyze]);

  const handleGoToLine = useCallback((line: number) => {
    goToLineRef.current?.(line);
  }, []);

  const scoreDelta =
    prevScore !== undefined && score !== 0 ? score - prevScore : undefined;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d1117]" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace" }}>
      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d] shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-[#00ff88] font-bold text-sm">MonadicStudio</span>
          <span className="text-[#484f58] text-xs">|</span>
          <span className="text-[#8b949e] text-xs">IDE per MonadicSharp</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#484f58]">
            {activePath ? activePath.split(/[/\\]/).pop() : 'Nessun file aperto'}
          </span>
          <div className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88]" title="Connesso" />
        </div>
      </header>

      {/* Forge unavailable banner */}
      {forgeUnavailableBanner && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#f9731622] border-b border-[#f9731644] text-[#f97316] text-xs shrink-0">
          <span>⚠ {forgeUnavailableBanner}</span>
          <button
            onClick={() => setForgeUnavailableBanner(null)}
            className="text-[#f97316] hover:text-[#e6edf3] ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main grid */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr 300px',
          gridTemplateRows: '1fr 200px',
          gridTemplateAreas: `
            "left center right"
            "left bottom bottom"
          `,
        }}
      >
        {/* Left */}
        <div style={{ gridArea: 'left' }} className="overflow-hidden">
          <LeftPanel onFileSelect={handleFileSelect} activePath={activePath} />
        </div>

        {/* Center */}
        <div style={{ gridArea: 'center' }} className="overflow-hidden">
          <CenterPanel
            filePath={activePath}
            content={editorContent}
            violations={violations}
            onContentChange={setEditorContent}
            onForceAnalyze={handleForceAnalyze}
            onGoToLineRef={goToLineRef}
          />
        </div>

        {/* Right */}
        <div style={{ gridArea: 'right' }} className="overflow-hidden">
          <RightPanel steps={pipelineSteps} />
        </div>

        {/* Bottom */}
        <div style={{ gridArea: 'bottom' }} className="overflow-hidden">
          <BottomPanel
            violations={violations}
            score={score}
            scoreDelta={scoreDelta}
            lastAnalyzed={lastAnalyzed}
            outputLines={outputLines}
            isAnalyzing={isAnalyzing}
            onGoToLine={handleGoToLine}
            onRunForge={handleForceAnalyze}
            onMigrate={handleMigrate}
          />
        </div>
      </div>
    </div>
  );
}
