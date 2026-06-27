import { useState, useCallback } from 'react';
import { ForgeResult } from '../types';

export function useForge() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<ForgeResult | null>(null);
  const [forgeUnavailable, setForgeUnavailable] = useState(false);

  const analyze = useCallback(async (filePath: string): Promise<ForgeResult | null> => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/forge/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });
      if (!res.ok) return null;
      const result = await res.json() as ForgeResult;
      setLastResult(result);
      return result;
    } catch {
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const migrate = useCallback(async (filePath: string): Promise<{ migrated: number } | null> => {
    try {
      const res = await fetch('/api/forge/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, confirmed: true }),
      });
      if (!res.ok) return null;
      return await res.json() as { migrated: number };
    } catch {
      return null;
    }
  }, []);

  return { isAnalyzing, lastResult, setLastResult, forgeUnavailable, setForgeUnavailable, analyze, migrate };
}
