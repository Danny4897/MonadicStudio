# MonadicStudio — Estensione Cursor / VS Code

Integrazione nativa nel workspace: avvio backend, bootstrap automatico della solution aperta, webview con il Pipeline Builder.

## Prerequisiti

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- Node.js 20+
- Cursor o VS Code 1.85+

## Build

Dalla root del repo:

```bash
npm run build:extension
```

Questo comando:

1. Compila il frontend (`frontend/dist`)
2. Copia gli asset in `extension/media/webview`
3. Compila TypeScript dell'estensione (`extension/dist`)

## Debug (F5)

1. Apri la cartella `MonadicStudio` in Cursor
2. Apri una solution .NET in un'altra finestra (o la stessa) — serve un workspace con `.sln` o `monadicstudio.json`
3. **Run and Debug** → **MonadicStudio Extension** → F5
4. Nella finestra Extension Development Host, apri la sidebar **MonadicStudio** → **Pipeline Builder**

Il backend parte automaticamente su `http://127.0.0.1:5000`.

## Comandi

| Comando | Azione |
|---------|--------|
| `MonadicStudio: Open Pipeline Builder` | Apre il canvas come **tab nell'editor** |
| `MonadicStudio: Refresh Solution Tree` | Ricollega workspace e ricarica l'albero |

## Flusso workspace

```
Cursor apre cartella
    → extension attiva backend (dotnet run)
    → webview invia { type: 'ready' }
    → POST /api/solution/bootstrap { workspaceRoot }
    → pipeline salvata in {workspace}/.monadicstudio/
    → Deploy scrive in outputDirectory configurato
```

## Pacchetto VSIX

```bash
npm run pack:extension
```

Genera `extension/monadic-studio-0.1.0.vsix`. Installa da Cursor: **Extensions** → `...` → **Install from VSIX**.

### Store Cursor (Open VSX)

Cursor cerca le estensioni su [Open VSX](https://open-vsx.org). Dopo la pubblicazione, cerca **MonadicStudio** nel pannello Extensions.

Guida completa: [docs/PUBLISHING.md](../PUBLISHING.md)

### Icona nella Activity Bar

Clic sull'icona pipeline → apre **MonadicStudio come tab nell'editor centrale** (non più nella sidebar).

Comando alternativo: `MonadicStudio: Open Pipeline Builder` (`Ctrl+Shift+P`).

## Modalità standalone vs extension

| | Standalone (`npm run dev`) | Extension |
|--|---------------------------|-----------|
| Link solution | Pannello manuale | Automatico dal workspace |
| Pipeline JSON | `backend/pipelines/` | `{workspace}/.monadicstudio/` |
| Deploy | Stesso endpoint | File nella solution aperta |

## Troubleshooting

- **Webview vuota / messaggio build**: esegui `npm run build:extension`
- **Engine offline**: serve **.NET 8 Runtime** (`dotnet --version`). Log in **Output → MonadicStudio**. Porta **5000** libera.
- **Failed to fetch** nell'explorer: engine non avviato — aggiorna alla v0.1.7+
- **No view is registered / PIPELINE BUILDER in sidebar**: disinstalla versioni vecchie, reinstalla, Reload Window
- **Demo data nell'explorer**: bootstrap fallito — usa **Refresh Solution Tree** o aggiungi `monadicstudio.json` (vedi `templates/monadicstudio.json`)
