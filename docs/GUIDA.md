# MonadicStudio — Guida all'utilizzo

MonadicStudio è un editor visuale locale per costruire pipeline **Railway-Oriented Programming (ROP)** e generare codice C# compatibile con **MonadicSharp**.

---

## 1. Avvio rapido

### Prerequisiti

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

### Avviare l'applicazione

Apri **due terminali** nella cartella del progetto:

```bash
# Terminale 1 — Engine (porta 5000)
cd backend
dotnet run
```

```bash
# Terminale 2 — UI (porta 5173)
cd frontend
npm install
npm run dev
```

Apri il browser su **http://localhost:5173**.

La topbar mostra:
- **Engine online** — backend raggiungibile
- **Engine offline** — avvia `dotnet run` nella cartella `backend`

---

## 2. Interfaccia

| Area | Funzione |
|------|----------|
| **Topbar** | Logo, tab attivo, conteggio nodi/edge, stato engine |
| **Navbar** | C# version, paradigma, + Meta, Save, Generate (compatta) |
| **Solution Explorer** | Albero classi/metodi della solution — trascina sul canvas |
| **Canvas** | Editor visuale React Flow |
| **Code Panel** | Codice C# generato, export `.cs` |

### Collegare la tua solution

In `backend/appsettings.Development.json` imposta il path al tuo progetto:

```json
"Solution": {
  "ProjectPath": "C:\\path\\to\\TuoProgetto\\TuoProgetto.csproj"
}
```

Puoi usare anche un `.sln` o una cartella sorgente. Riavvia il backend dopo la modifica.

Senza path configurato, l'explorer mostra **dati demo** (ValidateRequest, SaveToDb, ecc.).

---

## 3. Workflow operativo

### Step 1 — Costruire la pipeline

1. **Solution Explorer**: espandi una classe e **trascina un metodo** sul canvas — input/output sono precompilati dalla firma reale.
2. **Meta Creation**: clicca **+ Meta** nella navbar per aggiungere un nodo mapping al centro del canvas.
3. **Collegare**: trascina dagli handle ● per definire l'ordine di esecuzione.
4. **Rimuovere**: seleziona un nodo e premi `Delete`.

> L'ordine di esecuzione segue il flusso degli edge (topologico da sinistra a destra).

### Step 2 — Configurare la generazione

Nella sezione **Configuration**:

| Opzione | Valori | Effetto |
|---------|--------|---------|
| C# Target Version | 8.0 / 10.0 / 12.0 | Commento nel file generato (estendibile) |
| Paradigm Style | Functional ROP / Imperative | Catena `.Bind()` vs stile step-by-step |

### Step 3 — Generare il codice

1. Clicca **Generate Code**
2. Si apre il pannello destro con il C# formattato da Roslyn
3. Verifica il badge **Syntax OK** o eventuali warning
4. Clicca **Export .cs** per scaricare `GeneratedPipeline.cs`

### Step 4 — Salvare la pipeline

- **Auto-save**: ogni modifica viene salvata automaticamente dopo ~1.5 secondi
- **Manuale**: clicca **Save Pipeline**
- File: `backend/pipelines/default.json`
- Al reload della pagina la pipeline viene ripristinata

---

## 4. Integrare il codice in una soluzione .NET esistente

MonadicStudio **non si integra come pacchetto NuGet** nella tua solution: è uno **strumento di design** separato. Il flusso è:

```
MonadicStudio (design)  →  Export .cs  →  La tua solution (runtime)
```

### 4.1 Prerequisiti nella solution

Assicurati che il progetto target referenzi **MonadicSharp**:

```bash
dotnet add src/TuoProgetto/TuoProgetto.csproj package MonadicSharp
```

Oppure via Package Manager:
```
Install-Package MonadicSharp
```

### 4.2 Esportare da MonadicStudio

1. Costruisci la pipeline visuale
2. **Generate Code** → **Export .cs**
3. Ottieni `GeneratedPipeline.cs` (contiene extension stub + metodo `Execute`)

### 4.3 Copiare nella solution

**Opzione A — File unico (MVP, consigliata)**

```
TuoProgetto/
├── Pipelines/
│   ├── GeneratedPipeline.cs      ← incolla qui
│   └── MapUserToDbUserExtensions.cs  ← opzionale, se separi gli stub
```

1. Crea la cartella `Pipelines/` nel progetto Application o Domain
2. Copia il contenuto esportato
3. Adatta il **namespace** al tuo progetto:

```csharp
namespace TuoProgetto.Pipelines;

// ... codice generato ...
```

**Opzione B — Split manuale (produzione)**

Separa in file distinti:
- `*Extensions.cs` — stub Meta Creation (da implementare)
- `*Pipeline.cs` — orchestrazione ROP

### 4.4 Implementare gli stub Meta Creation

Il generatore crea metodi con `// TODO`. Esempio generato:

```csharp
public static Result<User, Error> MapUserToDbUser(this Request source)
{
    // TODO: Implementare mapping — "Map User to DbUser"
    return Result.Failure<User, Error>(new Error("MapUserToDbUser not implemented"));
}
```

Sostituisci con la logica reale:

```csharp
public static Result<User, Error> MapUserToDbUser(this Request source) =>
    Result.Success<User, Error>(new User { /* mapping */ });
```

### 4.5 Collegare i metodi Existing

I nodi **Existing Method** referenziano metodi che **devono già esistere** nel progetto:

```csharp
// Nel tuo progetto — es. Handlers/RequestHandler.cs
public static Result<Request, Error> ValidateRequest(Request input) { ... }
public static Result<User, Error> SaveToDb(User input) { ... }
```

Aggiungi `using` appropriati nel file generato se i metodi sono in altri namespace.

### 4.6 Invocare la pipeline

```csharp
using MonadicSharp;
using TuoProgetto.Pipelines;

// Nel tuo endpoint / handler
var result = GeneratedPipeline.Execute(request);

return result.Match(
    onSuccess: user => Results.Ok(user),
    onFailure: error => Results.BadRequest(error.Message)
);
```

### 4.7 Workflow consigliato con solution già avviata

```text
┌─────────────────────┐     ┌──────────────────────┐
│  MonadicStudio      │     │  Tua Solution        │
│  (terminale separato)│     │  (dotnet run / IIS)  │
│  localhost:5173     │     │  localhost:7xxx      │
└─────────┬───────────┘     └──────────┬───────────┘
          │                            │
          │  1. Design pipeline        │  3. dotnet build
          │  2. Export .cs ──────────► │  4. dotnet run
          │     (copia manuale)        │
          └────────────────────────────┘
```

1. Tieni MonadicStudio aperto in parallelo (non interferisce con la tua app)
2. Modifica la pipeline visuale
3. Export → copia nel progetto → `dotnet build`
4. Implementa gli stub TODO man mano che la pipeline cresce

> **Hot reload**: dopo aver copiato il file, `dotnet watch` nella tua solution ricompila automaticamente.

---

## 5. Esempio completo

### Pipeline visuale

```
ValidateRequest  →  [Map User to DbUser]  →  SaveToDb
```

### Codice generato (Functional ROP)

```csharp
using MonadicSharp;

namespace MioProgetto.Pipelines;

public static class MapUserToDbUserExtensions
{
    public static Result<User, Error> MapUserToDbUser(this Request source)
    {
        // TODO: Implementare mapping
        return Result.Failure<User, Error>(new Error("not implemented"));
    }
}

public static class GeneratedPipeline
{
    public static Result<User, Error> Execute(Request input)
    {
        return Result.Success<Request, Error>(input)
            .Bind(ValidateRequest)
            .Bind(x => x.MapUserToDbUser())
            .Bind(SaveToDb);
    }
}
```

### Uso nel controller Minimal API

```csharp
app.MapPost("/users", (Request req) =>
    GeneratedPipeline.Execute(req).ToHttpResult());
```

---

## 6. Scorciatoie e suggerimenti

| Azione | Come |
|--------|------|
| Pan canvas | Trascina con tasto sinistro su area vuota |
| Zoom | Rotella mouse o controlli in basso a sinistra |
| Mini-mappa | Angolo in basso a destra |
| Nuovo nodo | Drag dalla palette |
| Connessione | Drag tra handle ● |
| Elimina nodo/edge | Seleziona + `Delete` |
| Salva | Auto (1.5s) o **Save Pipeline** |
| Ricomincia da zero | Elimina `backend/pipelines/default.json` + reload |

---

## 7. Risoluzione problemi

| Problema | Soluzione |
|----------|-----------|
| Engine offline | `cd backend && dotnet run` |
| Generate Code fallisce | Verifica CORS e porta 5000 libera |
| Pipeline non si carica | Controlla `backend/pipelines/default.json` |
| Metodo non trovato in build | Aggiungi `using` o rendi il metodo accessibile |
| `Result` non riconosciuto | Installa/referenzia pacchetto `MonadicSharp` |

---

## 8. Struttura repository

```
MonadicStudio/
├── backend/                 # Engine .NET 8
│   ├── pipelines/           # Pipeline salvate (JSON)
│   └── Services/            # CodeGenerator + Roslyn + Persistence
├── frontend/                # UI React + React Flow
└── docs/
    └── GUIDA.md             # Questo file
```

---

## 9. Prossimi passi (roadmap)

- Import automatico metodi esistenti dalla solution (reflection)
- Generazione namespace/file multipli
- Plugin VS Code / Rider
- Packaging desktop (Tauri, come Tabularis)
