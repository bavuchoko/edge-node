import type { EdgeKind, GraphEdge, Point } from '../types'

type EdgeEditorProps = {
  edge: GraphEdge
  /** Anchor in canvas-relative screen px (edge midpoint). */
  position: Point
  /** Focus the label field on mount — used right after the edge is drawn. */
  autoFocus?: boolean
  onChange: (patch: Partial<Pick<GraphEdge, 'kind' | 'label'>>) => void
  onDelete: () => void
  onClose: () => void
}

const KINDS: Array<{ kind: EdgeKind; title: string; dash?: string }> = [
  { kind: 'required', title: 'Required' },
  { kind: 'optional', title: 'Optional', dash: '3 3' },
]

export function EdgeEditor({
  edge,
  position,
  autoFocus = false,
  onChange,
  onDelete,
  onClose,
}: EdgeEditorProps) {
  const kind = edge.kind ?? 'required'

  return (
    <div
      className="graph-edge-editor"
      style={{ left: position.x, top: position.y }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="graph-edge-editor__kinds" role="radiogroup" aria-label="Dependency type">
        {KINDS.map((option) => (
          <button
            key={option.kind}
            type="button"
            role="radio"
            aria-checked={kind === option.kind}
            className={`graph-edge-editor__kind${kind === option.kind ? ' is-active' : ''}`}
            onClick={() => onChange({ kind: option.kind })}
          >
            <svg width="18" height="6" viewBox="0 0 18 6" aria-hidden>
              <line
                x1="1"
                y1="3"
                x2="17"
                y2="3"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={option.dash}
              />
            </svg>
            {option.title}
          </button>
        ))}
      </div>
      <input
        className="graph-edge-editor__label"
        type="text"
        placeholder="Label"
        aria-label="Edge label"
        maxLength={40}
        value={edge.label ?? ''}
        autoFocus={autoFocus}
        onChange={(event) => onChange({ label: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault()
            onClose()
          }
        }}
      />
      <button
        type="button"
        className="graph-edge-editor__delete"
        aria-label="Delete connection"
        title="Delete connection"
        onClick={onDelete}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <path
            d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.6 8.5h4.8l.6-8.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
