import { getApiBase } from '../api/client'
import { getHostConfig, isVsCodeHost } from '../host/vscode'

type TopbarProps = {
  nodeCount: number
  edgeCount: number
  backendOnline: boolean
}

export function Topbar({ nodeCount, edgeCount, backendOnline }: TopbarProps) {
  const host = isVsCodeHost() ? getHostConfig() : null
  const meta =
    host?.extensionVersion && host?.author
      ? `v${host.extensionVersion} · ${host.author}`
      : null

  return (
    <header className="topbar">
      <div className="topbar-logo">
        <div className="topbar-logo-icon" aria-hidden>
          ◈
        </div>
        <span>
          Monadic<span style={{ color: 'var(--color-tb-accent)' }}>Studio</span>
        </span>
      </div>

      <div className="topbar-divider" />

      <div className="topbar-tab">
        <span className="topbar-tab-dot" />
        Pipeline Builder
      </div>

      <div className="topbar-spacer" />

      {meta && (
        <span className="topbar-chip topbar-meta" title={`Publisher: ${host?.publisher ?? ''}`}>
          {meta}
        </span>
      )}

      <span className="topbar-chip" style={{ borderColor: 'var(--color-tb-border)', background: 'var(--color-tb-elevated)', color: 'var(--color-tb-secondary)' }}>
        {nodeCount} nodi · {edgeCount} edge
      </span>

      <span className={`topbar-chip ${backendOnline ? 'online' : 'offline'}`}>
        {backendOnline && <span className="chip-pulse" />}
        {backendOnline ? 'Engine online' : 'Engine offline'}
      </span>
    </header>
  )
}

export async function checkBackendHealth(): Promise<boolean> {
  const origin = getApiBase().replace(/\/api$/, '')
  for (const route of ['/api/health', '/api/pipeline']) {
    try {
      const res = await fetch(`${origin}${route}`, { signal: AbortSignal.timeout(2000) })
      if (res.ok) return true
    } catch {
      // try next
    }
  }
  return false
}
