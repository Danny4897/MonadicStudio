import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { FileNode } from '../types';
import { broadcast } from '../ws-handler';
import { runForgeAnalyze } from '../forge';

const router = Router();

function buildFileTree(dir: string, depth: number = 0): FileNode[] {
  if (depth > 3) return [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const nodes: FileNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'bin' || entry.name === 'obj') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const children = buildFileTree(fullPath, depth + 1);
      const hasCs = hasAnyCsFile(fullPath);
      if (hasCs) {
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          children,
        });
      }
    } else if (entry.isFile() && entry.name.endsWith('.cs')) {
      nodes.push({
        name: entry.name,
        path: fullPath,
        type: 'file',
        greenScore: undefined,
      });
    }
  }

  return nodes;
}

function hasAnyCsFile(dir: string): boolean {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.cs')) return true;
      if (e.isDirectory() && e.name !== 'node_modules' && e.name !== 'bin' && e.name !== 'obj') {
        if (hasAnyCsFile(path.join(dir, e.name))) return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

// GET /api/files?root=<path>
router.get('/', (req: Request, res: Response) => {
  const root = req.query['root'] as string;
  if (!root) {
    res.status(400).json({ error: 'root parameter required' });
    return;
  }

  const decoded = decodeURIComponent(root);
  if (!fs.existsSync(decoded)) {
    res.status(404).json({ error: 'Path not found' });
    return;
  }

  const tree = buildFileTree(decoded);
  res.json(tree);
});

// GET /api/file?path=<encodedPath>
router.get('/file', (req: Request, res: Response) => {
  const filePath = req.query['path'] as string;
  if (!filePath) {
    res.status(400).json({ error: 'path parameter required' });
    return;
  }

  const decoded = decodeURIComponent(filePath);
  try {
    const content = fs.readFileSync(decoded, 'utf-8');
    res.json({ content, path: decoded });
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

// PUT /api/file?path=<encodedPath>
router.put('/file', async (req: Request, res: Response) => {
  const filePath = req.query['path'] as string;
  if (!filePath) {
    res.status(400).json({ error: 'path parameter required' });
    return;
  }

  const decoded = decodeURIComponent(filePath);
  const { content } = req.body as { content: string };

  try {
    fs.writeFileSync(decoded, content, 'utf-8');
    const timestamp = new Date().toISOString();
    broadcast({ type: 'file-saved', path: decoded, timestamp });

    // background forge analyze
    runForgeAnalyze(decoded).catch(() => {});

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to write file' });
  }
});

export default router;
