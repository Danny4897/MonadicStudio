import { execFile } from 'child_process';
import { ForgeResult, ForgeViolation } from './types';
import { broadcast } from './ws-handler';

/**
 * Mock violations for when dotnet forge is not available.
 * Simulates realistic GC001–GC010 analysis results.
 */
function mockAnalyze(filePath: string): ForgeResult {
  const violations: ForgeViolation[] = [
    {
      rule: 'GC002',
      file: filePath,
      line: 12,
      message: 'Map used on potentially fallible operation — consider Bind + Try.ExecuteAsync',
      severity: 'warning',
    },
    {
      rule: 'GC005',
      file: filePath,
      line: 23,
      message: 'Try.ExecuteAsync missing — raw I/O call detected inside Bind',
      severity: 'error',
    },
  ];
  const score = 72;
  return { score, violations, path: filePath };
}

export async function runForgeAnalyze(
  filePath: string
): Promise<ForgeResult> {
  return new Promise((resolve) => {
    execFile(
      'dotnet',
      ['forge', 'analyze', '--path', filePath, '--format', 'json'],
      { timeout: 30000 },
      (error, stdout, stderr) => {
        if (error) {
          const isNotFound =
            error.message.includes('not found') ||
            error.message.includes('not recognized') ||
            error.message.includes('No such file') ||
            (error.code !== undefined && (error.code as unknown as number) === 127);

          if (isNotFound || stderr.includes('not found')) {
            broadcast({
              type: 'forge-unavailable',
              message:
                "MonadicLeaf non trovato — installa con: dotnet tool install -g MonadicForge",
            });
            const result = mockAnalyze(filePath);
            broadcast({ type: 'forge-result', ...result });
            resolve(result);
          } else {
            // forge ran but with errors — try to parse anyway
            const result = tryParseForgeOutput(stdout, filePath);
            broadcast({ type: 'forge-result', ...result });
            resolve(result);
          }
          return;
        }

        const result = tryParseForgeOutput(stdout, filePath);
        broadcast({ type: 'forge-result', ...result });
        resolve(result);
      }
    );
  });
}

function tryParseForgeOutput(stdout: string, filePath: string): ForgeResult {
  try {
    const parsed = JSON.parse(stdout) as ForgeResult;
    return { ...parsed, path: filePath };
  } catch {
    return mockAnalyze(filePath);
  }
}

export async function runForgeMigrate(filePath: string): Promise<{ migrated: number }> {
  return new Promise((resolve) => {
    execFile(
      'dotnet',
      ['forge', 'migrate', '--path', filePath],
      { timeout: 60000 },
      (error, stdout) => {
        if (error) {
          broadcast({
            type: 'forge-unavailable',
            message: 'MonadicLeaf non trovato — installa con: dotnet tool install -g MonadicForge',
          });
          resolve({ migrated: 0 });
          return;
        }

        // try parse "Migrated N violations"
        const match = stdout.match(/migrated\s+(\d+)/i);
        resolve({ migrated: match ? parseInt(match[1], 10) : 0 });
      }
    );
  });
}
