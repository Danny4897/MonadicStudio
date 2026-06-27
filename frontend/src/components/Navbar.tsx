import type { CSharpVersion, ParadigmStyle } from '../types'

type NavbarProps = {
  csharpVersion: CSharpVersion
  paradigmStyle: ParadigmStyle
  isGenerating: boolean
  isSaving: boolean
  saveStatus: 'idle' | 'saved' | 'error'
  onCSharpVersionChange: (value: CSharpVersion) => void
  onParadigmStyleChange: (value: ParadigmStyle) => void
  onGenerate: () => void
  onSave: () => void
  onAddMetaNode: () => void
}

const csharpVersions: CSharpVersion[] = ['C# 8.0', 'C# 10.0', 'C# 12.0']
const paradigmStyles: ParadigmStyle[] = ['Functional ROP', 'Imperative']

export function Navbar({
  csharpVersion,
  paradigmStyle,
  isGenerating,
  isSaving,
  saveStatus,
  onCSharpVersionChange,
  onParadigmStyleChange,
  onGenerate,
  onSave,
  onAddMetaNode,
}: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-group">
        <label className="navbar-field">
          <span className="navbar-label">C#</span>
          <select
            value={csharpVersion}
            onChange={(e) => onCSharpVersionChange(e.target.value as CSharpVersion)}
            className="navbar-select"
          >
            {csharpVersions.map((v) => (
              <option key={v} value={v}>
                {v.replace('C# ', '')}
              </option>
            ))}
          </select>
        </label>

        <label className="navbar-field">
          <span className="navbar-label">Style</span>
          <select
            value={paradigmStyle}
            onChange={(e) => onParadigmStyleChange(e.target.value as ParadigmStyle)}
            className="navbar-select"
          >
            {paradigmStyles.map((s) => (
              <option key={s} value={s}>
                {s === 'Functional ROP' ? 'ROP' : 'Imperative'}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="navbar-divider" />

      <div className="navbar-group">
        <button type="button" onClick={onAddMetaNode} className="navbar-btn navbar-btn-ghost" title="Aggiungi Meta Creation al centro canvas">
          + Meta
        </button>
        <button type="button" onClick={onSave} disabled={isSaving} className="navbar-btn navbar-btn-ghost">
          {isSaving ? '…' : 'Save'}
        </button>
        {saveStatus === 'saved' && <span className="navbar-status ok">✓</span>}
        {saveStatus === 'error' && <span className="navbar-status err">!</span>}
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="navbar-btn navbar-btn-primary"
          title="Genera codice (Ctrl+G)"
        >
          {isGenerating ? <span className="btn-spinner" /> : 'Generate'}
        </button>
      </div>
    </nav>
  )
}
