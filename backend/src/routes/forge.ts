import { Router, Request, Response } from 'express';
import { runForgeAnalyze, runForgeMigrate } from '../forge';

const router = Router();

// POST /api/forge/analyze
router.post('/analyze', async (req: Request, res: Response) => {
  const { path } = req.body as { path: string };
  if (!path) {
    res.status(400).json({ error: 'path required' });
    return;
  }

  try {
    const result = await runForgeAnalyze(path);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'forge analyze failed' });
  }
});

// POST /api/forge/migrate
router.post('/migrate', async (req: Request, res: Response) => {
  const { path, confirmed } = req.body as { path: string; confirmed?: boolean };
  if (!path) {
    res.status(400).json({ error: 'path required' });
    return;
  }
  if (!confirmed) {
    res.status(400).json({ error: 'Explicit confirmed: true required' });
    return;
  }

  try {
    const result = await runForgeMigrate(path);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'forge migrate failed' });
  }
});

// GET /api/forge/score?path=<encodedPath>
router.get('/score', async (req: Request, res: Response) => {
  const filePath = req.query['path'] as string;
  if (!filePath) {
    res.status(400).json({ error: 'path required' });
    return;
  }

  const decoded = decodeURIComponent(filePath);
  try {
    const result = await runForgeAnalyze(decoded);
    res.json({ score: result.score, violations: result.violations });
  } catch {
    res.status(500).json({ error: 'forge score failed' });
  }
});

export default router;
