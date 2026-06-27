import * as vscode from 'vscode'
import { BackendManager } from './backendManager'
import { EditorPanelManager } from './editorPanel'
import { log, getOutputChannel } from './log'

let backend: BackendManager | undefined
let editorPanel: EditorPanelManager | undefined

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  backend = new BackendManager(context.extensionPath)
  context.subscriptions.push({ dispose: () => backend?.dispose() })
  context.subscriptions.push(getOutputChannel())

  editorPanel = new EditorPanelManager(context.extensionUri, backend)
  editorPanel.registerSerializer(context)

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

  const openInEditor = async () => {
    await startEngine('open')
    await editorPanel!.open(vscode.ViewColumn.Active)
  }

  void startEngine('activate')

  context.subscriptions.push(
    vscode.commands.registerCommand('monadicstudio.open', () => void openInEditor()),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('monadicstudio.refresh', async () => {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      if (!root) {
        void vscode.window.showWarningMessage('Apri una cartella workspace prima.')
        return
      }
      await startEngine('refresh')
      await backend!.bootstrapWorkspace(root)
      void vscode.window.showInformationMessage('MonadicStudio: solution ricollegata.')
      await editorPanel!.open()
    }),
  )

  const launcherProvider: vscode.TreeDataProvider<vscode.TreeItem> = {
    getTreeItem: () => new vscode.TreeItem(''),
    getChildren: () => [],
  }

  const treeView = vscode.window.createTreeView('monadicstudio.launcher', {
    treeDataProvider: launcherProvider,
    showCollapseAll: false,
  })

  context.subscriptions.push(
    treeView.onDidChangeVisibility((e) => {
      if (e.visible) {
        void openInEditor()
      }
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
  editorPanel = undefined
}
