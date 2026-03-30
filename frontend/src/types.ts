export interface ForgeViolation {
  rule: string;
  file: string;
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ForgeResult {
  score: number;
  violations: ForgeViolation[];
  path: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  greenScore?: number;
  children?: FileNode[];
}

export type WsEvent =
  | { type: 'file-saved'; path: string; timestamp: string }
  | { type: 'forge-result'; violations: ForgeViolation[]; score: number; path: string }
  | { type: 'score-update'; path: string; score: number; delta: number }
  | { type: 'forge-unavailable'; message: string }
  | { type: 'forge-output'; line: string; level: 'error' | 'warning' | 'info' | 'neutral' };
