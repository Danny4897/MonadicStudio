type CanvasEmptyStateProps = {
  visible: boolean
}

export function CanvasEmptyState({ visible }: CanvasEmptyStateProps) {
  if (!visible) return null

  return (
    <div className="canvas-empty">
      <div className="canvas-empty-card">
        <div className="canvas-empty-icon">◇</div>
        <h2 className="canvas-empty-title">Pipeline vuota</h2>
        <p className="canvas-empty-text">
          Trascina un metodo dall&apos;explorer a sinistra, oppure usa <kbd>+ Meta</kbd> per un
          mapping.
        </p>
        <ol className="canvas-empty-steps">
          <li>Collega i nodi con gli handle</li>
          <li>Clicca <strong>Generate</strong> nella navbar</li>
          <li>Esporta il file <code>.cs</code></li>
        </ol>
      </div>
    </div>
  )
}
