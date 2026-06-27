import * as vscode from 'vscode'
import { BackendManager } from './backendManager'
import { log, getOutputChannel } from './log'
import { MonadicStudioPanelProvider, openPanel } from './panelProvider'

let backend: BackendManager | undefined

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  backend = new BackendManager(context.extensionPath)
  context.subscriptions.push({ dispose: () => backend?.dispose() })
  context.subscriptions.push(getOutputChannel())

  const startEngine = async (reason: string) => {
    try {
      log(`Avvio richiesto (${reason})`)
      await backend!.ensureRunning()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore engine'
      log(`ERRORE: ${message}`)
      void vscode.window.showErrorMessage(`MonadicStudio: ${message}`, 'Apri log').then((choice) => {
        if (choice === 'Apri log') {
          getOutputChannel().show()
        }
      })
    }
  }

  void startEngine('activate')

  const provider = new MonadicStudioPanelProvider(context.extensionUri, backend)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(MonadicStudioPanelProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('monadicstudio.open', async () => {
      await backend!.ensureRunning()
      await openPanel(context.extensionUri, backend!)
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('monadicstudio.refresh', async () => {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      if (!root) {
        void vscode.window.showWarningMessage('Apri una cartella workspace prima.')
        return
      }
      await backend!.ensureRunning()
      await backend!.bootstrapWorkspace(root)
      void vscode.window.showInformationMessage('MonadicStudio: solution ricollegata.')
      await vscode.commands.executeCommand('monadicstudio.canvas.focus')
    }),
  )

  if (vscode.workspace.workspaceFolders?.length) {
    void startEngine('workspace')
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      if (vscode.workspace.workspaceFolders?.length) {
        void startEngine('workspace-change')
      }
    }),
  )
}

export function deactivate(): void {
  backend?.dispose()
  backend = undefined
}
