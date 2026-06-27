import React, { useEffect, useRef, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { setupMonacoOptions } from '../monaco/setup';
import { buildDecorations } from '../monaco/decorations';
import { registerHoverProviders } from '../monaco/hover-providers';
import { ForgeViolation } from '../types';

interface Props {
  filePath: string | null;
  content: string;
  violations: ForgeViolation[];
  onContentChange: (value: string) => void;
  onForceAnalyze: () => void;
  onGoToLineRef: React.MutableRefObject<((line: number) => void) | null>;
}

export function CenterPanel({
  filePath,
  content,
  violations,
  onContentChange,
  onForceAnalyze,
  onGoToLineRef,
}: Props) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const decorationsRef = useRef<Monaco.editor.IEditorDecorationsCollection | null>(null);
  const hoverDisposableRef = useRef<Monaco.IDisposable | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Expose goToLine
  useEffect(() => {
    onGoToLineRef.current = (line: number) => {
      editorRef.current?.revealLineInCenter(line);
      editorRef.current?.setPosition({ lineNumber: line, column: 1 });
      editorRef.current?.focus();
    };
  }, [onGoToLineRef]);

  // Apply decorations when violations change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const decs = buildDecorations(violations, monacoRef.current);
    if (decorationsRef.current) {
      decorationsRef.current.set(decs);
    } else {
      decorationsRef.current = editorRef.current.createDecorationsCollection(decs);
    }
  }, [violations]);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Register hover providers (dispose previous if any)
      hoverDisposableRef.current?.dispose();
      hoverDisposableRef.current = registerHoverProviders(monaco);

      // Ctrl+Shift+G → force analyze
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyG,
        () => onForceAnalyze()
      );
    },
    [onForceAnalyze]
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      const v = value ?? '';
      onContentChange(v);

      // debounce auto-save 1000ms
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (filePath) {
          fetch(`/api/file?path=${encodeURIComponent(filePath)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: v }),
          }).catch(() => {});
        }
      }, 1000);
    },
    [filePath, onContentChange]
  );

  if (!filePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0d1117] text-[#8b949e]">
        <span className="text-4xl mb-3">🧬</span>
        <p className="text-sm">Apri un file .cs dal pannello sinistro</p>
        <p className="text-xs mt-1 text-[#484f58]">Ctrl+Shift+G per analisi Forge</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Tab bar */}
      <div className="flex items-center px-3 py-1 border-b border-[#30363d] bg-[#161b22]">
        <span className="text-xs text-[#00ff88] font-mono">
          {filePath.split(/[/\\]/).pop()}
        </span>
        <span className="ml-2 text-xs text-[#484f58] truncate hidden sm:block">
          {filePath}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <Editor
          value={content}
          onChange={handleChange}
          onMount={handleMount}
          options={setupMonacoOptions()}
          theme="vs-dark"
          language="csharp"
          loading={
            <div className="flex items-center justify-center h-full text-[#8b949e] text-sm">
              Caricamento Monaco...
            </div>
          }
        />
      </div>
    </div>
  );
}
