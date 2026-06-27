# Pubblicazione su Cursor Extensions (Open VSX)

Cursor usa **[Open VSX Registry](https://open-vsx.org)** come marketplace per le estensioni classiche (pannello Extensions), **non** il Microsoft VS Code Marketplace.

> **Nota:** [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish) è per i **Cursor Plugins** (skills, MCP, rules) — diverso da questa estensione webview.

## Checklist una tantum (~10 min)

### 1. Account Open VSX

1. Vai su [open-vsx.org](https://open-vsx.org) → login con **GitHub** (account `Danny4897`)
2. Profile → **Log in with Eclipse** → crea account Eclipse se necessario
3. Profile → **Show Publisher Agreement** → **Agree**

### 2. Access token

1. [open-vsx.org/user-settings/tokens](https://open-vsx.org/user-settings/tokens)
2. **Generate New Token** → copia il valore (mostrato una sola volta)

### 3. Namespace `monadicleaf`

```powershell
$env:OVSX_PAT = "il-tuo-token"
npx ovsx create-namespace monadicleaf -p $env:OVSX_PAT
```

### 4. Pubblica

```powershell
cd C:\Users\adani\Desktop\MonadicStudio
npm run publish:openvsx
```

### 5. Verifica

- Listing: [open-vsx.org/monadicleaf/monadic-studio](https://open-vsx.org/monadicleaf/monadic-studio)
- In Cursor: Extensions → cerca **MonadicStudio**

### 6. (Consigliato) Namespace verificato

Apri issue su [eclipse/openvsx](https://github.com/eclipse/openvsx/wiki/Namespace-Access) per claim del namespace `monadicleaf` collegato al repo GitHub.

---

## CI automatica (GitHub Actions)

Dopo il primo publish manuale, configura il secret:

```powershell
gh secret set OVSX_PAT -R Danny4897/MonadicStudio
```

Poi:

- **Manuale:** Actions → **Publish to Open VSX** → Run workflow
- **Release:** crea una GitHub Release → publish automatico

---

## Aggiornamenti

1. Bump `version` in `extension/package.json`
2. `npm run publish:openvsx` (locale) oppure push tag/release (CI)

Cursor riceve gli aggiornamenti da Open VSX automaticamente (può richiedere alcune ore).

---

## Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| Extension non in Cursor | Attendi sync Open VSX; riavvia Cursor; cerca `monadicleaf.monadic-studio` |
| `Namespace already exists` | Normale se già creato — procedi con `publish` |
| Publisher Agreement mancante | Completa login Eclipse su open-vsx.org |
| Secret scan rejected | Rimuovi token/credenziali dal codice |
