import React, { useState } from 'react';
import { FileNode } from '../types';
import { FileTree } from '../components/FileTree';

interface Props {
  onFileSelect: (node: FileNode) => void;
  activePath: string | null;
}

export function LeftPanel({ onFileSelect, activePath }: Props) {
  const [rootPath, setRootPath] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTree = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files?root=${encodeURIComponent(path)}`);
      if (!res.ok) {
        const err = await res.json() as { error: string };
        setError(err.error);
        setTree([]);
      } else {
        const data = await res.json() as FileNode[];
        setTree(data);
        setRootPath(path);
      }
    } catch {
      setError('Impossibile raggiungere il backend');
      setTree([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) loadTree(inputValue.trim());
  };

  return (
    <div className="flex flex-col h-full bg-[#161b22] border-r border-[#30363d]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#30363d]">
        <span className="text-xs font-bold text-[#00ff88] uppercase tracking-wider">
          Progetto
        </span>
      </div>

      {/* Path input */}
      <form onSubmit={handleSubmit} className="px-2 py-2 border-b border-[#30363d]">
        <div className="flex gap-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Percorso progetto..."
            className="flex-1 bg-[#0d1117] text-[#e6edf3] text-xs px-2 py-1.5 rounded border border-[#30363d]
              focus:outline-none focus:border-[#00ff8866] placeholder-[#484f58] font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="text-xs px-2 py-1.5 rounded bg-[#00ff8822] text-[#00ff88] border border-[#00ff8844]
              hover:bg-[#00ff8833] disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? '⟳' : 'Apri'}
          </button>
        </div>
        {error && (
          <p className="text-xs text-[#ef4444] mt-1">{error}</p>
        )}
      </form>

      {/* File tree */}
      <div className="flex-1 overflow-auto py-1">
        {rootPath && (
          <div className="px-2 pb-1">
            <span className="text-xs text-[#484f58] truncate block font-mono">
              {rootPath.split(/[/\\]/).pop() ?? rootPath}
            </span>
          </div>
        )}
        <FileTree nodes={tree} activePath={activePath} onSelect={onFileSelect} />
      </div>
    </div>
  );
}
