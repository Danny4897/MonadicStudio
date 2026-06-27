import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { BackendManager, getWorkspaceRoot } from './backendManager'

export class MonadicStudioPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'monadicstudio.canvas'

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly backend: BackendManager,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media', 'webview')],
    }

    webviewView.webview.html = this.getHtml(webviewView.webview)
    this.wireMessages(webviewView.webview)
  }

  private wireMessages(webview: vscode.Webview): void {
    webview.onDidReceiveMessage(async (message: { type: string }) => {
      if (message.type === 'ready') {
        const workspaceRoot = getWorkspaceRoot(vscode)
        if (workspaceRoot) {
          try {
            await this.backend.bootstrapWorkspace(workspaceRoot)
            webview.postMessage({
              type: 'init',
              mode: 'vscode',
              workspaceRoot,
              linked: true,
            })
          } catch (err) {
            webview.postMessage({
              type: 'init',
              mode: 'vscode',
              workspaceRoot,
              linked: false,
              error: err instanceof Error ? err.message : 'Bootstrap failed',
            })
          }
        } else {
          webview.postMessage({ type: 'init', mode: 'vscode', linked: false, error: 'Nessun workspace aperto' })
        }
      }
    })
  }

  private getHtml(webview: vscode.Webview): string {
    const webviewDir = path.join(this.extensionUri.fsPath, 'media', 'webview')
    const indexPath = path.join(webviewDir, 'index.html')

    if (!fs.existsSync(indexPath)) {
      return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:16px;color:#ccc;background:#111">
        <h3>MonadicStudio</h3>
        <p>Webview non compilata. Esegui <code>npm run build:extension</code> dalla root del repo.</p>
      </body></html>`
    }

    let html = fs.readFileSync(indexPath, 'utf8')
    html = html.replace(/(href|src)="\.\/([^"]+)"/g, (_match, attr, asset) => {
      const uri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', asset))
      return `${attr}="${uri}"`
    })
    html = html.replace(/(href|src)="\/([^"]+)"/g, (_match, attr, asset) => {
      const uri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', asset))
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
}

export async function openPanel(
  extensionUri: vscode.Uri,
  backend: BackendManager,
): Promise<void> {
  await vscode.commands.executeCommand('monadicstudio.canvas.focus')
}
