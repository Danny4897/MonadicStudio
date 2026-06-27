export type HostConfig = {
  mode: 'web' | 'vscode'
  apiBase: string
  workspaceRoot?: string
  linked?: boolean
  engineOnline?: boolean
  error?: string
}

declare global {
  interface Window {
    __MONADIC_HOST__?: Partial<HostConfig>
  }
}

let hostConfig: HostConfig = {
  mode: window.__MONADIC_HOST__?.mode === 'vscode' ? 'vscode' : 'web',
  apiBase: 'http://127.0.0.1:5000/api',
  workspaceRoot: undefined,
  linked: false,
}

let initialized = false
const initListeners: Array<() => void> = []

export function isVsCodeHost(): boolean {
  return hostConfig.mode === 'vscode' || typeof acquireVsCodeApi !== 'undefined'
}

export function getHostConfig(): HostConfig {
  return hostConfig
}

export function onHostInit(listener: () => void): void {
  if (initialized) {
    listener()
    return
  }
  initListeners.push(listener)
}

function notifyInit(): void {
  initialized = true
  for (const listener of initListeners) listener()
  initListeners.length = 0
}

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    const data = event.data as Partial<HostConfig> & { type?: string }
    if (data?.type !== 'init') return

    hostConfig = {
      mode: 'vscode',
      apiBase: 'http://127.0.0.1:5000/api',
      workspaceRoot: data.workspaceRoot,
      linked: data.linked,
      engineOnline: data.engineOnline,
      error: data.error,
    }
    notifyInit()
  })
}

declare function acquireVsCodeApi(): unknown
