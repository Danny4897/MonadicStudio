import * as vscode from 'vscode'
import type { BackendManager } from './backendManager'
import { buildWebviewHtml, getWebviewOptions, wireWebviewMessages } from './webviewContent'

export const EDITOR_PANEL_TYPE = 'monadicstudio.editor'

export class EditorPanelManager {
  private panel?: vscode.WebviewPanel

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly backend: BackendManager,
  ) {}

  async open(column: vscode.ViewColumn = vscode.ViewColumn.Active): Promise<void> {
    if (this.panel) {
      this.panel.reveal(column)
      return
    }

    this.panel = vscode.window.createWebviewPanel(
      EDITOR_PANEL_TYPE,
      'MonadicStudio',
      column,
      {
        ...getWebviewOptions(this.extensionUri),
        retainContextWhenHidden: true,
      },
    )

    this.panel.iconPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'icon.png')
    this.panel.webview.html = buildWebviewHtml(this.panel.webview, this.extensionUri)
    wireWebviewMessages(this.panel.webview, this.backend)

    this.panel.onDidDispose(() => {
      this.panel = undefined
    })
  }

  registerSerializer(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.window.registerWebviewPanelSerializer(EDITOR_PANEL_TYPE, {
        deserializeWebviewPanel: async (panel) => {
          this.panel = panel
          panel.webview.options = getWebviewOptions(this.extensionUri)
          panel.webview.html = buildWebviewHtml(panel.webview, this.extensionUri)
          wireWebviewMessages(panel.webview, this.backend)
          panel.onDidDispose(() => {
            this.panel = undefined
          })
        },
      }),
    )
  }
}
