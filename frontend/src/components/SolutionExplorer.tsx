import { useEffect, useMemo, useState } from 'react'
import { fetchSolutionTree } from '../api/solutionApi'
import type { SolutionClass, SolutionMethod, SolutionTreeResponse } from '../types/solution'
import { DRAG_MIME } from '../types/solution'
import { isVsCodeHost } from '../host/vscode'
import { SolutionLinkPanel } from './SolutionLinkPanel'
import { TreeSkeleton } from './TreeSkeleton'

function MethodItem({ cls, method }: { cls: SolutionClass; method: SolutionMethod }) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData(
      DRAG_MIME,
      JSON.stringify({
        type: 'existingMethod',
        methodName: method.name,
        inputType: method.inputType,
        outputType: method.outputType,
        className: cls.name,
      }),
    )
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className="tree-method"
      draggable
      onDragStart={onDragStart}
      title={`Trascina ${method.name} sul canvas`}
    >
      <span className="tree-method-icon">ƒ</span>
      <div className="tree-method-body">
        <span className="tree-method-name">{method.name}</span>
        <span className="tree-method-sig">
          <span className="sig-in">{method.inputType}</span>
          <span className="sig-arrow">→</span>
          <span className="sig-out">{method.outputType}</span>
        </span>
      </div>
      <span className="tree-drag-hint" aria-hidden>
        ⋮⋮
      </span>
    </div>
  )
}

function ClassGroup({ cls, defaultOpen }: { cls: SolutionClass; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const fullName = cls.namespace ? `${cls.namespace}.${cls.name}` : cls.name

  return (
    <div className="tree-class">
      <button
        type="button"
        className="tree-class-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={`tree-chevron ${open ? 'open' : ''}`}>›</span>
        <span className="tree-class-icon">◫</span>
        <div className="tree-class-labels">
          <span className="tree-class-name">{cls.name}</span>
          {cls.namespace && <span className="tree-class-ns">{cls.namespace}</span>}
        </div>
        <span className="tree-class-count">{cls.methods.length}</span>
      </button>
      {open && (
        <div className="tree-methods">
          {cls.methods.map((m) => (
            <MethodItem key={`${fullName}.${m.name}`} cls={cls} method={m} />
          ))}
        </div>
      )}
    </div>
  )
}

export function SolutionExplorer() {
  const [tree, setTree] = useState<SolutionTreeResponse | null>(null)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setTree(await fetchSolutionTree())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento solution')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredClasses = useMemo(() => {
    if (!tree) return []
    const q = filter.trim().toLowerCase()
    if (!q) return tree.classes

    return tree.classes
      .map((cls) => ({
        ...cls,
        methods: cls.methods.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            cls.name.toLowerCase().includes(q) ||
            cls.namespace.toLowerCase().includes(q),
        ),
      }))
      .filter((cls) => cls.methods.length > 0)
  }, [tree, filter])

  const totalMethods = filteredClasses.reduce((n, c) => n + c.methods.length, 0)

  return (
    <aside className="explorer solution-explorer">
      <div className="explorer-header">
        <div className="explorer-header-row">
          <p className="explorer-title">Solution Explorer</p>
          <button
            type="button"
            className="explorer-refresh"
            onClick={() => void load()}
            disabled={loading}
            title="Ricarica albero"
          >
            ↻
          </button>
        </div>
        {tree?.isFallback && (
          <span className="explorer-badge demo">Demo data</span>
        )}
        {tree?.sourcePath && !tree.isFallback && (
          <p className="explorer-hint truncate" title={tree.sourcePath}>
            {tree.sourcePath.split(/[/\\]/).pop()}
          </p>
        )}
        {!loading && !error && (
          <p className="explorer-meta">
            {filteredClasses.length} classi · {totalMethods} metodi
          </p>
        )}
      </div>

      {!isVsCodeHost() && <SolutionLinkPanel onLinked={() => void load()} />}

      <div className="explorer-search">
        <span className="search-icon" aria-hidden>
          ⌕
        </span>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtra classi o metodi…"
          className="tb-input explorer-search-input"
        />
      </div>

      <div className="explorer-body tree-root">
        {loading && <TreeSkeleton />}
        {error && (
          <div className="tree-empty-state">
            <p className="tree-error">{error}</p>
            <button type="button" className="navbar-btn navbar-btn-ghost" onClick={() => void load()}>
              Riprova
            </button>
          </div>
        )}
        {!loading && !error && filteredClasses.length === 0 && (
          <div className="tree-empty-state">
            <p>Nessun metodo trovato</p>
            {filter && (
              <button type="button" className="link-btn" onClick={() => setFilter('')}>
                Cancella filtro
              </button>
            )}
          </div>
        )}
        {filteredClasses.map((cls, i) => (
          <ClassGroup key={`${cls.namespace}.${cls.name}`} cls={cls} defaultOpen={i < 4} />
        ))}
      </div>
    </aside>
  )
}
