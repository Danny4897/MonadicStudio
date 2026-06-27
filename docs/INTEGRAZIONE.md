# Collega MonadicStudio a una solution esistente

## 1. Copia il manifest nella root della solution

```bash
copy templates\monadicstudio.json C:\path\to\TuaSolution\monadicstudio.json
```

Modifica i path nel file.

## 2. Assicurati che il progetto referenzi MonadicSharp

```bash
cd C:\path\to\TuaSolution\src\TuoProgetto
dotnet add package MonadicSharp
```

## 3. Collega da MonadicStudio UI

1. Avvia backend + frontend
2. Nell'explorer, sezione **Collega Solution**
3. Incolla il path della cartella solution (dove c'è `monadicstudio.json` o `.sln`)
4. Clicca **Scopri** → **Collega**
5. L'explorer caricherà le classi/metodi reali

## 4. Genera e scrivi nel progetto

1. Costruisci la pipeline sul canvas
2. **Generate** per anteprima
3. **Deploy** per scrivere `GeneratedPipeline.cs` in `outputDirectory`

Il file viene scritto direttamente nel progetto — `dotnet watch` ricompila automaticamente.

## Alternativa: appsettings

In `backend/appsettings.Development.json`:

```json
"Solution": {
  "ProjectPath": "C:\\path\\to\\TuoProgetto.csproj",
  "OutputDirectory": "C:\\path\\to\\TuoProgetto\\Pipelines",
  "RootNamespace": "TuoProgetto.Pipelines"
}
```
