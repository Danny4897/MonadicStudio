export function TreeSkeleton() {
  return (
    <div className="tree-skeleton" aria-hidden>
      {[1, 2, 3].map((i) => (
        <div key={i} className="tree-skeleton-group">
          <div className="skeleton skeleton-line" style={{ width: '75%' }} />
          <div className="tree-skeleton-methods">
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" style={{ width: '85%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
