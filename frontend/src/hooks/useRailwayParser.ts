import { useMemo } from 'react';
import { parseRopPipeline, PipelineStep } from '../parser/ropParser';

export function useRailwayParser(code: string): PipelineStep[] {
  return useMemo(() => parseRopPipeline(code), [code]);
}
