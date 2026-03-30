import React, { useState } from 'react';
import { FileNode } from '../types';
import { GreenScoreBadge } from './GreenScoreBadge';

interface Props {
  nodes: FileNode[];
  activePath: string | null;
  onSelect: (node: FileNode) => void;
  depth?: number;
}

export function FileTree({ nodes, activePath, onSelect, depth = 0 }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (nodes.length === 0) {
    return (
      <div className="text-[#8b949e] text-xs px-2 py-1 italic">
        Nessun file .cs trovato
      </div>
    );
  }

  return (
    <div>
      {nodes.map((node) => {
        const isDir = node.type === 'directory';
        const isOpen = !collapsed[node.path];
        const isActive = node.path === activePath;

        return (
          <div key={node.path}>
            <div
              className={`flex items-center gap-1 px-2 py-0.5 cursor-pointer hover:bg-[#21262d] text-sm select-none
                ${isActive && !isDir ? 'file-active' : ''}`}
              style={{ paddingLeft: `${8 + depth * 14}px` }}
              onClick={() => {
                if (isDir) {
                  setCollapsed((p) => ({ ...p, [node.path]: !p[node.path] }));
                } else {
                  onSelect(node);
                }
              }}
            >
              <span className="text-[#8b949e] w-3 shrink-0 text-center text-xs">
                {isDir ? (isOpen ? '▾' : '▸') : ''}
              </span>
              <span className="text-[#58a6ff] text-xs mr-1">
                {isDir ? '📁' : '📄'}
              </span>
              <span className={`flex-1 truncate text-xs ${isActive && !isDir ? 'text-[#00ff88]' : 'text-[#e6edf3]'}`}>
                {node.name}
              </span>
              {!isDir && <GreenScoreBadge score={node.greenScore} />}
            </div>

            {isDir && isOpen && node.children && (
              <FileTree
                nodes={node.children}
                activePath={activePath}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
