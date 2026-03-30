export interface PipelineStep {
  id: string;
  method: 'Bind' | 'Map' | 'Match' | 'WithRetry' | 'Try' | 'CachingAgent' | 'CircuitBreaker' | 'Other';
  label: string;
  lineNumber: number;
  hasRetry?: boolean;
  retryCount?: number;
  hasCache?: boolean;
  hasCircuitBreaker?: boolean;
}

export function parseRopPipeline(code: string): PipelineStep[] {
  const lines = code.split('\n');
  const steps: PipelineStep[] = [];
  let idCounter = 0;

  const patterns: Array<{ regex: RegExp; method: PipelineStep['method'] }> = [
    { regex: /\.Bind\s*\(\s*(\w+)?/, method: 'Bind' },
    { regex: /\.Map\s*\(\s*(\w+)?/, method: 'Map' },
    { regex: /\.Match\s*\(\s*(\w+)?/, method: 'Match' },
    { regex: /Try\.ExecuteAsync\s*\(/, method: 'Try' },
    { regex: /Try\.Execute\s*\(/, method: 'Try' },
    { regex: /CachingAgentWrapper/, method: 'CachingAgent' },
    { regex: /CircuitBreaker/, method: 'CircuitBreaker' },
    { regex: /\.WithRetry\s*\(/, method: 'WithRetry' },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const { regex, method } of patterns) {
      const match = regex.exec(line);
      if (!match) continue;

      if (method === 'WithRetry') {
        // attach to last step
        if (steps.length > 0) {
          const last = steps[steps.length - 1];
          last.hasRetry = true;
          const countMatch = /maxAttempts\s*:\s*(\d+)/.exec(line);
          last.retryCount = countMatch ? parseInt(countMatch[1], 10) : 3;
        }
        break;
      }

      // extract label from lambda/method ref
      let label = method as string;
      const lambdaMatch = /\.\w+\s*\(\s*(?:\w+\s*=>\s*)?(\w+)/.exec(line);
      if (lambdaMatch?.[1] && lambdaMatch[1] !== 'x' && lambdaMatch[1] !== '_') {
        label = lambdaMatch[1];
      }

      const step: PipelineStep = {
        id: `step-${idCounter++}`,
        method,
        label,
        lineNumber: i + 1,
        hasCache: method === 'CachingAgent',
        hasCircuitBreaker: method === 'CircuitBreaker',
      };

      steps.push(step);
      break;
    }
  }

  return steps;
}

export function getStepSuggestion(step: PipelineStep): string {
  switch (step.method) {
    case 'Map':
      return `// ⚠ Regola GC002 — Se l'operazione può fallire, considera:
.Bind(x => Try.ExecuteAsync(() => ${step.label}(x)))
// invece di:
.Map(x => ${step.label}(x))`;

    case 'Bind':
      return `// ✓ Bind corretto — assicurati di usare Try.ExecuteAsync per I/O:
.Bind(x => Try.ExecuteAsync(() => ${step.label}(x)))`;

    case 'Try':
      return `// ✓ GC005 — Try.ExecuteAsync per ogni I/O:
.Bind(x => Try.ExecuteAsync(async () => await ${step.label}(x)))`;

    case 'WithRetry':
      return `// ✓ GC002 — WithRetry con jitter obbligatorio:
.WithRetry(maxAttempts: 3, useJitter: true, initialDelay: TimeSpan.FromSeconds(1))`;

    case 'CachingAgent':
      return `// ✓ GC003 — CachingAgentWrapper prima di ogni chiamata LLM:
var cachedAgent = new CachingAgentWrapper(agent, cache, ttl: TimeSpan.FromMinutes(5));`;

    case 'CircuitBreaker':
      return `// ✓ GC007 — CircuitBreaker su agenti esterni:
.WithCircuitBreaker(failureThreshold: 3, resetTimeout: TimeSpan.FromSeconds(30))`;

    case 'Match':
      return `// ✓ Match — terminatore della pipeline:
.Match(
  onSuccess: result => Ok(result),
  onFailure: err => BadRequest(err.Message)
)`;

    default:
      return `// Nessun suggerimento per ${step.method}`;
  }
}
