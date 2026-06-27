import { Highlight, themes } from 'prism-react-renderer'
import { downloadCsFile } from '../api/solutionApi'

type CodePanelProps = {
  code: string | null
  error: string | null
  diagnostics: string[]
  isValid: boolean
  isDeploying: boolean
  deployMessage: string | null
  onDeploy: () => void
  onClose: () => void
}

export function CodePanel({
  code,
  error,
  diagnostics,
  isValid,
  isDeploying,
  deployMessage,
  onDeploy,
  onClose,
}: CodePanelProps) {
  if (!code && !error) return null

  return (
    <div className="code-panel">
      <div className="code-panel-header">
        <div className="code-panel-tab">
          <span className="code-panel-tab-icon">{'</>'}</span>
          GeneratedPipeline.cs
        </div>
        <div className="flex items-center gap-2">
          {code && (
            <>
              <button
                type="button"
                onClick={onDeploy}
                disabled={isDeploying}
                className="navbar-btn navbar-btn-primary"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.7rem' }}
                title="Scrivi il file nella solution collegata"
              >
                {isDeploying ? <span className="btn-spinner" /> : 'Deploy'}
              </button>
              <button
                type="button"
                onClick={() => downloadCsFile(code)}
                className="tb-btn tb-btn-ghost"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.7rem' }}
              >
                Download
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="tb-btn tb-btn-ghost"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.7rem' }}
          >
            ✕
          </button>
        </div>
      </div>

      {!error && code && (
        <div className="border-b px-4 py-2" style={{ borderColor: 'var(--color-tb-border)' }}>
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: isValid ? 'var(--color-tb-success)' : 'var(--color-tb-warning)' }}
          >
            {isValid ? '● Syntax OK · MonadicSharp' : '● Warnings'}
          </span>
          {deployMessage && (
            <p className="mt-1 font-mono text-[10px]" style={{ color: 'var(--color-tb-success)' }}>
              {deployMessage}
            </p>
          )}
          {diagnostics.length > 0 && (
            <ul className="mt-1 max-h-20 overflow-y-auto text-[10px]" style={{ color: 'var(--color-tb-muted)' }}>
              {diagnostics.map((d, i) => (
                <li key={i} className="font-mono">
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {error ? (
          <p className="font-mono text-sm" style={{ color: 'var(--color-tb-danger)' }}>
            {error}
          </p>
        ) : (
          <Highlight theme={themes.vsDark} code={code ?? ''} language="csharp">
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={`${className} !m-0 rounded-[var(--radius-md)] !p-4 font-mono text-xs leading-relaxed`}
                style={{
                  ...style,
                  background: 'var(--color-tb-base)',
                  border: '1px solid var(--color-tb-border)',
                }}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    <span
                      className="mr-4 inline-block w-6 select-none text-right"
                      style={{ color: 'var(--color-tb-muted)' }}
                    >
                      {i + 1}
                    </span>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        )}
      </div>
    </div>
  )
}
