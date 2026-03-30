import type * as Monaco from 'monaco-editor';
import { ForgeViolation } from '../types';

const RULE_CLASS_MAP: Record<string, string> = {
  GC001: 'gc001-error',
  GC002: 'gc002-warning',
  GC003: 'gc003-info',
  GC004: 'gc002-warning',
  GC005: 'gc001-error',
};

export function buildDecorations(
  violations: ForgeViolation[],
  monaco: typeof Monaco
): Monaco.editor.IModelDeltaDecoration[] {
  return violations.map((v) => {
    const cls = RULE_CLASS_MAP[v.rule] ?? 'gc002-warning';
    return {
      range: new monaco.Range(v.line, 1, v.line, 200),
      options: {
        isWholeLine: false,
        className: cls,
        glyphMarginClassName: v.severity === 'error' ? 'gc001-glyph' : 'gc002-glyph',
        hoverMessage: {
          value: `**${v.rule}** — ${v.message}`,
        },
      },
    };
  });
}
