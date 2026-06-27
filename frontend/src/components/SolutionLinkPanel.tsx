import { useEffect, useState } from 'react'
import {
  discoverSolution,
  fetchSolutionConfig,
  linkSolution,
} from '../api/solutionApi'
import type { SolutionSettings } from '../types/solution'

type SolutionLinkPanelProps = {
  onLinked: () => void
}

export function SolutionLinkPanel({ onLinked }: SolutionLinkPanelProps) {
  const [config, setConfig] = useState<SolutionSettings | null>(null)
  const [path, setPath] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    void fetchSolutionConfig()
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [])

  const isLinked = Boolean(config?.projectPath)

  const handleDiscover = async () => {
    if (!path.trim()) return
    setBusy(true)
    setStatus(null)
    try {
      const result = await discoverSolution(path.trim())
      if (!result.found || !result.projectPath) {
        setStatus(result.message ?? 'Nessun progetto trovato')
        return
      }
      await linkSolution({
        projectPath: result.projectPath,
        outputDirectory: result.suggestedOutputDirectory ?? undefined,
        rootNamespace: result.suggestedNamespace ?? undefined,
      })
      setConfig(await fetchSolutionConfig())
      setStatus('Solution collegata')
      onLinked()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Errore')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="solution-link-panel">
      <button
        type="button"
        className="solution-link-toggle"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={`tree-chevron ${expanded ? 'open' : ''}`}>›</span>
        <span className="solution-link-title">Collega Solution</span>
        <span className={`solution-link-badge ${isLinked ? 'linked' : 'demo'}`}>
          {isLinked ? 'Linked' : 'Demo'}
        </span>
      </button>

      {expanded && (
        <div className="solution-link-body">
          {isLinked && config?.projectPath && (
            <p className="solution-link-current" title={config.projectPath}>
              {config.projectPath.split(/[/\\]/).slice(-2).join('/')}
            </p>
          )}
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="C:\path\to\TuaSolution"
            className="tb-input"
          />
          <button
            type="button"
            className="navbar-btn navbar-btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            onClick={() => void handleDiscover()}
            disabled={busy || !path.trim()}
          >
            {busy ? '…' : 'Scopri e collega'}
          </button>
          {status && <p className="solution-link-status">{status}</p>}
          <p className="solution-link-hint">
            Punta alla cartella con <code>monadicstudio.json</code> o <code>.sln</code>
          </p>
        </div>
      )}
    </div>
  )
}
