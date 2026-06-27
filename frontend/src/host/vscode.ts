import { getHostConfig, isVsCodeHost, onHostInit } from './config'

export { getHostConfig, isVsCodeHost }

export async function waitForHostBootstrap(): Promise<void> {
  if (!isVsCodeHost()) return

  return new Promise((resolve) => {
    onHostInit(() => resolve())
    const vscode = acquireVsCodeApi()
    vscode.postMessage({ type: 'ready' })
  })
}

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void
}
