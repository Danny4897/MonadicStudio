import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import type { BackendManager } from './backendManager'
import { getWorkspaceRoot } from './backendManager'

export function buildWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const webviewDir = path.join(extensionUri.fsPath, 'media', 'webview')
  const indexPath = path.join(webviewDir, 'index.html')

  if (!fs.existsSync(indexPath)) {
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:16px;color:#ccc;background:#111">
      <h3>MonadicStudio</h3>
      <p>Webview non compilata. Esegui <code>npm run build:extension</code> dalla root del repo.</p>
    </body></html>`
  }

  let html = fs.readFileSync(indexPath, 'utf8')
  html = html.replace(/(href|src)="\.\/([^"]+)"/g, (_match, attr, asset) => {
    const uri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'webview', asset))
    return `${attr}="${uri}"`
  })
  html = html.replace(/(href|src)="\/([^"]+)"/g, (_match, attr, asset) => {
    const uri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'webview', asset))
    return `${attr}="${uri}"`
  })

  const nonce = String(Date.now())
  html = html.replace(/<script /g, `<script nonce="${nonce}" `)

  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src ${webview.cspSource} https://fonts.gstatic.com`,
    `script-src 'nonce-${nonce}' ${webview.cspSource}`,
    `connect-src http://127.0.0.1:5000 http://localhost:5000`,
  ].join('; ')

  html = html.replace(
    '<head>',
    `<head><meta http-equiv="Content-Security-Policy" content="${csp}"><script nonce="${nonce}">window.__MONADIC_HOST__={mode:'vscode'};</script>`,
  )

  return html
}

export function wireWebviewMessages(webview: vscode.Webview, backend: BackendManager): void {
  webview.onDidReceiveMessage(async (message: { type: string }) => {
    if (message.type !== 'ready') return

    const workspaceRoot = getWorkspaceRoot(vscode)
    try {
      await backend.ensureRunning()
      if (workspaceRoot) {
        await backend.bootstrapWorkspace(workspaceRoot)
        webview.postMessage({
          type: 'init',
          mode: 'vscode',
          workspaceRoot,
          linked: true,
          engineOnline: true,
        })
      } else {
        webview.postMessage({
          type: 'init',
          mode: 'vscode',
          linked: false,
          engineOnline: true,
          error: 'Nessun workspace aperto',
        })
      }
    } catch (err) {
      webview.postMessage({
        type: 'init',
        mode: 'vscode',
        workspaceRoot,
        linked: false,
        engineOnline: false,
        error: err instanceof Error ? err.message : 'Engine offline',
      })
    }
  })
}

export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media', 'webview')],
  }
}
