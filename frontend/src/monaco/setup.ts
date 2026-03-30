import type * as Monaco from 'monaco-editor';

export function setupMonacoOptions(): Monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    language: 'csharp',
    theme: 'vs-dark',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    lineNumbers: 'on',
    renderLineHighlight: 'line',
    cursorBlinking: 'smooth',
    wordWrap: 'off',
    padding: { top: 12, bottom: 12 },
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
    },
    bracketPairColorization: { enabled: true },
  };
}
