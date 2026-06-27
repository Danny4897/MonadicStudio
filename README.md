# MonadicStudio

Visual node editor (React Flow) per generare codice C# Railway-Oriented Programming con **MonadicSharp**.

📖 **[Guida all'utilizzo](docs/GUIDA.md)** · **[Integrazione solution](docs/INTEGRAZIONE.md)** · **[Estensione Cursor](docs/EXTENSION.md)** · **[Store Open VSX](docs/PUBLISHING.md)**

## Funzionalità

- Canvas React Flow con nodi **Existing Method** e **Meta Creation**
- Drag & drop dalla palette per aggiungere nodi
- Connessione nodi tramite edge (click su handle)
- Eliminazione nodi con `Delete` / `Backspace`
- Generazione codice ROP (Functional / Imperative)
- Formattazione e validazione sintassi con **Roslyn**
- Export file `.cs` dal pannello codice
- Persistenza pipeline su file locale (`backend/pipelines/default.json`)
- Auto-save debounced (1.5s) + salvataggio manuale

## Struttura

```
MonadicStudio/
├── backend/          # .NET 8 Minimal API (porta 5000)
├── frontend/         # React + Vite + React Flow
├── extension/        # Estensione Cursor/VS Code (webview + backend spawn)
├── scripts/          # Build helper
└── docs/
```

## Avvio

**Terminale 1 — Backend:**
```bash
cd backend
dotnet run
```

**Terminale 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Apri `http://localhost:5173`

## Come testare (checklist completa)

### 1. Drag & drop nodi
1. Avvia backend e frontend
2. Dalla sidebar, trascina **Existing Method** o **Meta Creation** sul canvas
3. Verifica che il nodo appaia nella posizione del drop
4. Collega i nodi trascinando dagli handle (pallini laterali)
5. Seleziona un nodo e premi `Delete` per rimuoverlo

### 2. Generazione codice + Roslyn
1. Usa la pipeline mock (3 nodi pre-caricati) oppure creane una nuova
2. Nel nodo **Meta Creation**, inserisci un prompt (es. `Map User to DbUser`)
3. Seleziona paradigma **Functional ROP** → clicca **Generate Code**
4. Verifica nel pannello destro:
   - Codice formattato con indentazione Roslyn
   - Badge **Syntax OK** o eventuali warning
   - Catena `.Bind()` per Functional ROP
5. Cambia paradigma in **Imperative** → rigenera → verifica stile imperativo con `stepN`

### 3. Export `.cs`
1. Dopo la generazione, clicca **Export .cs** nel pannello codice
2. Verifica il download di `GeneratedPipeline.cs`
3. Apri il file e controlla il contenuto

### 4. Persistenza pipeline
1. Modifica nodi, spostali, aggiungine di nuovi
2. Attendi ~1.5s (auto-save) oppure clicca **Save Pipeline**
3. Verifica messaggio "Pipeline salvata"
4. Controlla file `backend/pipelines/default.json`
5. Ricarica la pagina (`F5`) → la pipeline deve ripristinarsi

### 5. Test API diretto (opzionale)

```powershell
# Genera codice
$body = '{"csharpVersion":"C# 12.0","paradigmStyle":"Functional ROP","nodes":[{"id":"n1","type":"existingMethod","methodName":"ValidateRequest","inputType":"Request","outputType":"Result<Request, Error>"}]}'
Invoke-RestMethod -Uri "http://localhost:5000/api/generate" -Method POST -Body $body -ContentType "application/json"

# Salva pipeline
Invoke-RestMethod -Uri "http://localhost:5000/api/pipeline" -Method POST -Body '{"name":"default","csharpVersion":"C# 12.0","paradigmStyle":"Functional ROP","nodes":[],"edges":[],"savedAt":"2026-01-01T00:00:00Z"}' -ContentType "application/json"

# Carica pipeline
Invoke-RestMethod -Uri "http://localhost:5000/api/pipeline/default"
```

## API

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/generate` | Genera codice C# formattato con Roslyn |
| GET | `/api/pipeline/{name}` | Carica pipeline salvata |
| POST | `/api/pipeline` | Salva pipeline su disco |
| GET | `/api/pipeline` | Lista pipeline salvate |
