import * as vscode from 'vscode'
import { BackendManager } from './backendManager'
import { EditorPanelManager } from './editorPanel'
import { log, getOutputChannel } from './log'

const LAUNCHER_VIEW_ID = 'monadicstudio.launcher'

let backend: BackendManager | undefined
let editorPanel: EditorPanelManager | undefined

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const version = context.extension.packageJSON.version as string
  log(`MonadicStudio v${version} — attivazione`)

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
    await vscode.commands.executeCommand('workbench.action.closeSidebar')
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
      await openInEditor()
    }),
  )

  registerLauncherView(context, () => void openInEditor())

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50)
  statusBar.text = '$(type-hierarchy) MonadicStudio'
  statusBar.tooltip = 'Apri Pipeline Builder nell\'editor'
  statusBar.command = 'monadicstudio.open'
  statusBar.show()
  context.subscriptions.push(statusBar)

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

function registerLauncherView(context: vscode.ExtensionContext, onVisible: () => void): void {
  const contributes = context.extension.packageJSON.contributes as {
    views?: Record<string, Array<{ id: string }>>
  }
  const views = contributes?.views?.['monadic-studio'] ?? []
  const hasLauncher = views.some((v) => v.id === LAUNCHER_VIEW_ID)

  if (!hasLauncher) {
    log(
      `View "${LAUNCHER_VIEW_ID}" assente nel manifest installato. Disinstalla versioni vecchie e reinstalla.`,
    )
    void vscode.window.showWarningMessage(
      'MonadicStudio: estensione non aggiornata. Disinstalla e reinstalla la v0.1.7+.',
      'Apri Extensions',
    ).then((choice) => {
      if (choice === 'Apri Extensions') {
        void vscode.commands.executeCommand('workbench.view.extensions')
      }
    })
    return
  }

  const provider: vscode.TreeDataProvider<vscode.TreeItem> = {
    getTreeItem: () => new vscode.TreeItem(''),
    getChildren: () => [],
  }

  const treeView = vscode.window.createTreeView(LAUNCHER_VIEW_ID, {
    treeDataProvider: provider,
    showCollapseAll: false,
  })

  context.subscriptions.push(
    treeView.onDidChangeVisibility((e) => {
      if (e.visible) {
        onVisible()
      }
    }),
  )
}

export function deactivate(): void {
  backend?.dispose()
  backend = undefined
  editorPanel = undefined
}
