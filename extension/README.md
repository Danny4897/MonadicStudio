# MonadicStudio

Visual pipeline editor for **Railway-Oriented Programming** in C# with [MonadicSharp](https://github.com/Danny4897/MonadicSharp).

![MonadicStudio](https://img.shields.io/badge/MonadicSharp-ROP-6366f1)
![.NET 8](https://img.shields.io/badge/.NET-8.0-512bd4)
![License MIT](https://img.shields.io/badge/license-MIT-green)

## Features

- **Visual canvas** — drag methods from Solution Explorer, connect nodes with edges
- **MonadicSharp codegen** — `Result<T>`, `.Bind()`, `Error.Create()` (no exceptions in control flow)
- **Roslyn** — format and validate generated C#
- **Deploy to workspace** — writes `GeneratedPipeline.cs` into your linked .NET project
- **Auto-save** — pipeline persisted in `.monadicstudio/` (extension) or `backend/pipelines/` (standalone)

## Install in Cursor

Search **MonadicStudio** in the Extensions panel (Open VSX registry).

**Requirements:** [.NET 8 Runtime](https://dotnet.microsoft.com/download) (o SDK) su PATH — l’estensione avvia l’engine automaticamente al primo utilizzo.

## Quick start (extension)

1. Open a .NET solution folder in Cursor
2. Sidebar → **MonadicStudio** → **Pipeline Builder**
3. Drag methods onto the canvas → **Generate** (`Ctrl+G`) → **Deploy**

## Quick start (standalone)

```bash
cd backend && dotnet run
cd frontend && npm install && npm run dev
```

Open http://localhost:5173

## Docs

- [Guida](docs/GUIDA.md)
- [Integrazione solution](docs/INTEGRAZIONE.md)
- [Estensione Cursor](docs/EXTENSION.md)
- [Pubblicazione store](docs/PUBLISHING.md)

## Repository layout

```
MonadicStudio/
├── backend/     # .NET 8 API (port 5000)
├── frontend/    # React + React Flow UI
├── extension/   # Cursor / VS Code extension
└── docs/
```

## License

MIT — see [LICENSE](LICENSE)
