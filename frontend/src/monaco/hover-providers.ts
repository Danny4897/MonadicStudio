import type * as Monaco from 'monaco-editor';

interface HoverEntry {
  pattern: RegExp;
  markdown: string;
}

const HOVER_ENTRIES: HoverEntry[] = [
  {
    pattern: /^WithRetry$/,
    markdown: [
      '**WithRetry** — green-code GC002',
      '```csharp',
      '.WithRetry(maxAttempts: 3, useJitter: true, initialDelay: TimeSpan.FromSeconds(1))',
      '```',
      '> `useJitter: true` obbligatorio per evitare thundering herd.',
    ].join('\n'),
  },
  {
    pattern: /^Map$/,
    markdown: [
      '**Map** — solo per operazioni **infallibili**.',
      '',
      'Se può lanciare eccezione:',
      '```csharp',
      '.Bind(x => Try.ExecuteAsync(() => TuaOperazione(x)))',
      '```',
      '> Vedi regola GC002.',
    ].join('\n'),
  },
  {
    pattern: /^Bind$/,
    markdown: [
      '**Bind** — passo principale della pipeline ROP.',
      '',
      '```csharp',
      '.Bind(x => Try.ExecuteAsync(async () => await CallService(x)))',
      '```',
      '> Usa sempre `Try.ExecuteAsync` per I/O (GC005).',
    ].join('\n'),
  },
  {
    pattern: /^Match$/,
    markdown: [
      '**Match** — terminatore della pipeline.',
      '```csharp',
      '.Match(',
      '  onSuccess: result => Ok(result),',
      '  onFailure: err => BadRequest(err.Message)',
      ')',
      '```',
    ].join('\n'),
  },
  {
    pattern: /^CachingAgentWrapper$/,
    markdown: [
      '**CachingAgentWrapper** — GC003',
      '',
      'Wrappa ogni agente LLM chiamato più volte.',
      '```csharp',
      'var cached = new CachingAgentWrapper(agent, cache,',
      '    ttl: TimeSpan.FromMinutes(5));',
      '```',
    ].join('\n'),
  },
  {
    pattern: /^CircuitBreaker$/,
    markdown: [
      '**CircuitBreaker** — GC007',
      '',
      '```csharp',
      '.WithCircuitBreaker(',
      '    failureThreshold: 3,',
      '    resetTimeout: TimeSpan.FromSeconds(30))',
      '```',
    ].join('\n'),
  },
  {
    pattern: /^ValidatedResult$/,
    markdown: [
      '**ValidatedResult** — GC004',
      '',
      'Usa al boundary di output LLM per validare la struttura:',
      '```csharp',
      'var validated = ValidatedResult.From(llmOutput, schema);',
      '```',
    ].join('\n'),
  },
];

export function registerHoverProviders(monaco: typeof Monaco): Monaco.IDisposable {
  return monaco.languages.registerHoverProvider('csharp', {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const entry = HOVER_ENTRIES.find((e) => e.pattern.test(word.word));
      if (!entry) return null;

      return {
        range: new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        ),
        contents: [{ value: entry.markdown }],
      };
    },
  });
}
